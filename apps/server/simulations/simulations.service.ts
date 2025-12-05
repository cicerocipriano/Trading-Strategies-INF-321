/**
 * Serviço responsável por todas as operações relacionadas a simulações.
 * Implementa a lógica de negócio para CRUD, paginação e cálculos.
 */
import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';

import {
    db,
    SelectSimulation,
    SelectSimulationLeg,
    SelectStrategyLeg,
    InsertSimulationLeg,
} from '../db';

import { eq, desc, asc } from 'drizzle-orm';
import * as schema from '../../../drizzle/schema';

import { CreateSimulationDto } from './dto/create-simulation.dto';
import { UpdateSimulationDto } from './dto/update-simulation.dto';
import { CreateSimulationLegDto } from './dto/create-simulation-leg.dto';

import { SimulationEngineService } from '../market/simulation-engine.service';
import { MarketService, BrapiHistoricalPrice } from '../market/market.service';
import { StrategyExecutionType } from '../market/simulation-engine.types';
import { StrategyLegFactory } from '../strategies/strategy-leg.factory';
import { mapExecutionTypeFromStrategyName } from './strategy-execution.mapper';

/**
 * Interface para opções de paginação
 */
export interface PaginationOptions {
    limit?: number;
    offset?: number;
    orderBy?: 'recent' | 'oldest';
}

@Injectable()
export class SimulationsService {
    private readonly logger = new Logger(SimulationsService.name);

    constructor(
        private readonly simulationEngine: SimulationEngineService,
        private readonly marketService: MarketService,
        private readonly strategyLegFactory: StrategyLegFactory,
    ) { }

    /**
     * Obtém todas as simulações de um usuário com paginação
     */
    async getUserSimulations(
        userId: string,
        options?: PaginationOptions,
    ): Promise<SelectSimulation[]> {
        try {
            let query = db
                .select()
                .from(schema.simulations)
                .where(eq(schema.simulations.userId, userId))
                .$dynamic();

            // Ordenação
            if (options?.orderBy === 'oldest') {
                query = query.orderBy(asc(schema.simulations.createdAt));
            } else {
                query = query.orderBy(desc(schema.simulations.createdAt));
            }

            // Paginação
            if (options?.limit) {
                query = query.limit(options.limit);
            }
            if (options?.offset) {
                query = query.offset(options.offset);
            }

            const simulations = await query;
            console.log(
                `[SimulationsService] ${simulations.length} simulações obtidas para usuário ${userId}`,
            );
            return simulations;
        } catch (error) {
            console.error('[SimulationsService] Erro ao obter simulações:', error);
            throw new BadRequestException('Erro ao obter simulações');
        }
    }

    /**
 * Obtém uma simulação por ID com suas pernas.
 *
 * Se a data de término já passou e o status ainda não for CONCLUDED,
 * roda o backtest, atualiza e devolve a simulação concluída.
 */
    async getSimulationById(id: string): Promise<
        SelectSimulation & { legs: SelectSimulationLeg[] }
    > {
        try {
            const [simulation] = await db
                .select()
                .from(schema.simulations)
                .where(eq(schema.simulations.id, id))
                .limit(1);

            if (!simulation) {
                throw new NotFoundException(
                    `Simulação com ID ${id} não encontrada`,
                );
            }

            // Carrega legs da simulação
            const legs = await db
                .select()
                .from(schema.simulationLegs)
                .where(eq(schema.simulationLegs.simulationId, id));

            // Carrega estratégia para mapear executionType
            const [strategy] = await db
                .select()
                .from(schema.strategies)
                .where(eq(schema.strategies.id, simulation.strategyId));

            const executionType: StrategyExecutionType =
                mapExecutionTypeFromStrategyName(strategy?.name);

            const now = new Date();
            const endDate =
                simulation.endDate instanceof Date
                    ? simulation.endDate
                    : new Date(simulation.endDate as unknown as string);

            let finalSimulation = simulation;

            // Se já passou do fim e ainda não foi concluída, finaliza agora
            if (endDate <= now && simulation.status !== 'CONCLUDED') {
                const result = await this.simulationEngine.runBacktest({
                    ...simulation,
                    strategyExecutionType: executionType,
                    legs,
                });

                const [updated] = await db
                    .update(schema.simulations)
                    .set({
                        totalReturn: result.totalReturn.toFixed(2),
                        returnPercentage: result.returnPercentage.toFixed(4),
                        maxDrawdown: result.maxDrawdown.toFixed(4),
                        status: 'CONCLUDED',
                    })
                    .where(eq(schema.simulations.id, simulation.id))
                    .returning();

                this.logger.log(
                    `[SimulationsService] Simulação ${simulation.id} concluída sob demanda no getSimulationById`,
                );

                finalSimulation = updated;
            }

            return { ...finalSimulation, legs };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            console.error('[SimulationsService] Erro ao obter simulação:', error);
            throw new BadRequestException('Erro ao obter simulação');
        }
    }

    /**
     * Cria uma nova simulação.
     *
     * - Se a data de término já passou, roda o backtest imediatamente
     *   e salva o resultado com status CONCLUDED.
     * - Se a data de término for futura, cria como IN_PROGRESS.
     */
    async createSimulation(dto: CreateSimulationDto) {
        try {
            // 0) Insere a simulação como IN_PROGRESS
            const [inserted] = await db
                .insert(schema.simulations)
                .values({
                    userId: dto.userId,
                    strategyId: dto.strategyId,
                    assetSymbol: dto.assetSymbol,
                    simulationName: dto.simulationName,
                    startDate: dto.startDate,
                    endDate: dto.endDate,
                    initialCapital: dto.initialCapital,
                    status: 'IN_PROGRESS',
                })
                .returning();

            if (!inserted) {
                throw new BadRequestException(
                    'Falha ao inserir simulação no banco',
                );
            }

            // 1) Busca estratégia
            const [strategy] = await db
                .select()
                .from(schema.strategies)
                .where(eq(schema.strategies.id, inserted.strategyId));

            if (!strategy) {
                this.logger.warn(
                    `[SimulationsService] Estratégia ${inserted.strategyId} não encontrada. Usando BUY_HOLD_STOCK como padrão.`,
                );
            }

            // 2) Busca legs de estratégia (templates)
            const strategyLegTemplates: SelectStrategyLeg[] = await db
                .select()
                .from(schema.strategyLegs)
                .where(eq(schema.strategyLegs.strategyId, inserted.strategyId));

            // 3) Instancia as simulation_legs com base nos strategy_legs via factory
            let simulationLegs: SelectSimulationLeg[] = [];

            if (strategyLegTemplates.length > 0) {
                const startDate = new Date(dto.startDate);
                const endDate = new Date(dto.endDate);

                const underlyingPriceAtStart =
                    await this.getUnderlyingPriceAtStart(
                        inserted.assetSymbol,
                        startDate,
                        endDate,
                    );

                if (underlyingPriceAtStart !== null) {
                    const legInserts: InsertSimulationLeg[] =
                        this.strategyLegFactory.instantiateLegs({
                            templates: strategyLegTemplates,
                            simulation: {
                                id: inserted.id,
                                initialCapital: Number(
                                    inserted.initialCapital?.toString() ?? '0',
                                ),
                                startDate,
                                endDate,
                                assetSymbol: inserted.assetSymbol,
                            },
                            underlyingPriceAtStart,
                        });

                    if (legInserts.length > 0) {
                        simulationLegs = await db
                            .insert(schema.simulationLegs)
                            .values(legInserts)
                            .returning();
                    }
                } else {
                    this.logger.warn(
                        `[SimulationsService] Não foi possível obter preço inicial para ${inserted.assetSymbol}. Nenhuma SimulationLeg gerada.`,
                    );
                }
            }

            // 4) Determina o executionType (por enquanto via nome)
            const executionType: StrategyExecutionType =
                mapExecutionTypeFromStrategyName(strategy?.name);

            // 5) Verifica se o período já terminou
            const now = new Date();
            const endDate = new Date(dto.endDate);
            const isPastPeriod = endDate.getTime() <= now.getTime();

            if (!isPastPeriod) {
                // Período futuro → deixa IN_PROGRESS e retorna a simulação com legs
                this.logger.log(
                    `[SimulationsService] Simulação ${inserted.id} criada como IN_PROGRESS (período futuro).`,
                );
                return {
                    ...inserted,
                    legs: simulationLegs,
                };
            }

            // 6) Período passado → roda o backtest imediatamente
            const backtest = await this.simulationEngine.runBacktest({
                ...inserted,
                strategyExecutionType: executionType,
                legs: simulationLegs,
            });

            const [updated] = await db
                .update(schema.simulations)
                .set({
                    totalReturn: backtest.totalReturn.toFixed(2),
                    returnPercentage: backtest.returnPercentage.toFixed(4),
                    maxDrawdown: backtest.maxDrawdown.toFixed(4),
                    status: 'CONCLUDED',
                })
                .where(eq(schema.simulations.id, inserted.id))
                .returning();

            this.logger.log(
                `[SimulationsService] Simulação ${inserted.id} criada e concluída imediatamente (período passado)`,
            );

            return updated;
        } catch (error) {
            this.logger.error(
                '[SimulationsService] Erro ao criar simulação',
                error instanceof Error ? error.stack : String(error),
            );
            throw new BadRequestException('Erro ao criar simulação');
        }
    }

    /**
     * Atualiza uma simulação existente
     */
    async updateSimulation(
        id: string,
        updateSimulationDto: UpdateSimulationDto,
    ): Promise<SelectSimulation> {
        try {
            // Verificar se simulação existe
            await this.getSimulationById(id);

            const [simulation] = await db
                .update(schema.simulations)
                .set(updateSimulationDto)
                .where(eq(schema.simulations.id, id))
                .returning();

            console.log(`[SimulationsService] Simulação atualizada: ${id}`);
            return simulation;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            console.error('[SimulationsService] Erro ao atualizar simulação:', error);
            throw new BadRequestException('Erro ao atualizar simulação');
        }
    }

    /**
     * Deleta uma simulação e suas pernas
     */
    async deleteSimulation(id: string): Promise<{ message: string }> {
        try {
            // Verificar se simulação existe
            await this.getSimulationById(id);

            await db.delete(schema.simulations).where(eq(schema.simulations.id, id));

            console.log(`[SimulationsService] Simulação deletada: ${id}`);
            return { message: 'Simulação deletada com sucesso' };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            console.error('[SimulationsService] Erro ao deletar simulação:', error);
            throw new BadRequestException('Erro ao deletar simulação');
        }
    }

    /**
     * Obtém as pernas de uma simulação
     */
    async getSimulationLegs(simulationId: string): Promise<SelectSimulationLeg[]> {
        try {
            const legs = await db
                .select()
                .from(schema.simulationLegs)
                .where(eq(schema.simulationLegs.simulationId, simulationId));

            return legs;
        } catch (error) {
            console.error('[SimulationsService] Erro ao obter pernas:', error);
            throw new BadRequestException('Erro ao obter pernas da simulação');
        }
    }

    /**
     * Adiciona uma perna a uma simulação
     */
    async addSimulationLeg(
        createLegDto: CreateSimulationLegDto,
    ): Promise<SelectSimulationLeg> {
        try {
            // Verificar se simulação existe
            await this.getSimulationById(createLegDto.simulationId);

            const [leg] = await db
                .insert(schema.simulationLegs)
                .values(createLegDto)
                .returning();

            console.log(`[SimulationsService] Perna adicionada: ${leg.id}`);
            return leg;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            console.error('[SimulationsService] Erro ao adicionar perna:', error);
            throw new BadRequestException('Erro ao adicionar perna');
        }
    }

    /**
     * Adiciona múltiplas pernas a uma simulação
     */
    async addMultipleSimulationLegs(
        legs: CreateSimulationLegDto[],
    ): Promise<SelectSimulationLeg[]> {
        try {
            if (!legs.length) return [];

            // Verificar se simulação existe
            if (legs.length > 0) {
                await this.getSimulationById(legs[0].simulationId);
            }

            const inserted = await db
                .insert(schema.simulationLegs)
                .values(legs)
                .returning();

            console.log(`[SimulationsService] ${inserted.length} pernas adicionadas`);
            return inserted;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            console.error('[SimulationsService] Erro ao adicionar pernas:', error);
            throw new BadRequestException('Erro ao adicionar pernas');
        }
    }

    /**
     * Deleta uma perna de simulação
     */
    async deleteSimulationLeg(legId: string): Promise<{ message: string }> {
        try {
            const [leg] = await db
                .select()
                .from(schema.simulationLegs)
                .where(eq(schema.simulationLegs.id, legId))
                .limit(1);

            if (!leg) {
                throw new NotFoundException(`Perna com ID ${legId} não encontrada`);
            }

            await db.delete(schema.simulationLegs).where(eq(schema.simulationLegs.id, legId));

            console.log(`[SimulationsService] Perna deletada: ${legId}`);
            return { message: 'Perna deletada com sucesso' };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            console.error('[SimulationsService] Erro ao deletar perna:', error);
            throw new BadRequestException('Erro ao deletar perna');
        }
    }

    /**
     * Atualiza uma perna de simulação
     */
    async updateSimulationLeg(
        legId: string,
        updateData: Partial<CreateSimulationLegDto>,
    ): Promise<SelectSimulationLeg> {
        try {
            const [leg] = await db
                .update(schema.simulationLegs)
                .set(updateData)
                .where(eq(schema.simulationLegs.id, legId))
                .returning();

            if (!leg) {
                throw new NotFoundException(`Perna com ID ${legId} não encontrada`);
            }

            console.log(`[SimulationsService] Perna atualizada: ${legId}`);
            return leg;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            console.error('[SimulationsService] Erro ao atualizar perna:', error);
            throw new BadRequestException('Erro ao atualizar perna');
        }
    }

    /**
     * Calcula estatísticas básicas de simulações de um usuário
     */
    async getUserStatistics(userId: string): Promise<{
        totalSimulations: number;
        profitableSimulations: number;
        losingSimulations: number;
        winRate: string;
        avgReturn: string;
        simulatedCapital: number;
    }> {
        try {
            const simulations = await this.getUserSimulations(userId);

            const totalSimulations = simulations.length;

            if (totalSimulations === 0) {
                return {
                    totalSimulations: 0,
                    profitableSimulations: 0,
                    losingSimulations: 0,
                    winRate: '0.00',
                    avgReturn: '0.00',
                    simulatedCapital: 0,
                };
            }

            const returns = simulations.map((s) =>
                Number.parseFloat(s.returnPercentage?.toString() ?? '0'),
            );

            const profitableSimulations = simulations.filter((s) => {
                const totalReturn = Number.parseFloat(s.totalReturn?.toString() ?? '0');
                return totalReturn > 0;
            }).length;

            const losingSimulations = totalSimulations - profitableSimulations;

            const winRate = ((profitableSimulations / totalSimulations) * 100).toFixed(2);

            const avgReturn = (returns.reduce((a, b) => a + b, 0) / totalSimulations).toFixed(2);

            const capital = this.capitalAgregado(simulations);

            const simulatedCapital = capital.totalInitial + capital.totalReturn;

            console.log(`[SimulationsService] Estatísticas calculadas para usuário ${userId}`);

            return {
                totalSimulations,
                profitableSimulations,
                losingSimulations,
                winRate,
                avgReturn,
                simulatedCapital,
            };
        } catch (error) {
            console.error('[SimulationsService] Erro ao calcular estatísticas:', error);
            throw new BadRequestException('Erro ao calcular estatísticas');
        }
    }

    private capitalAgregado(
        simulations: {
            id: string;
            createdAt: Date;
            strategyId: string;
            userId: string;
            assetSymbol: string;
            simulationName: string;
            startDate: Date;
            endDate: Date;
            initialCapital: string;
            totalReturn: string | null;
            returnPercentage: string | null;
            maxDrawdown: string | null;
        }[],
    ) {
        return simulations.reduce(
            (acumulador, simulacao: any) => {
                const inicial = parseFloat(simulacao.initialCapital?.toString() ?? '0');
                const totalReturn = parseFloat(simulacao.totalReturn?.toString() ?? '0');
                acumulador.totalInitial += inicial;
                acumulador.totalReturn += totalReturn;
                return acumulador;
            },
            { totalInitial: 0, totalReturn: 0 },
        );
    }

    /**
 * Busca o preço de fechamento mais próximo do startDate
 * para o ativo informado, usando a brapi.
 */
    private async getUnderlyingPriceAtStart(
        symbol: string,
        startDate: Date,
        endDate: Date,
    ): Promise<number | null> {
        try {
            const now = new Date();
            const MS_PER_DAY = 1000 * 60 * 60 * 24;
            const daysBack = Math.max(
                0,
                (now.getTime() - startDate.getTime()) / MS_PER_DAY,
            );

            let range: string;
            if (daysBack <= 31) range = '1mo';
            else if (daysBack <= 93) range = '3mo';
            else if (daysBack <= 186) range = '6mo';
            else if (daysBack <= 365) range = '1y';
            else if (daysBack <= 365 * 2) range = '2y';
            else range = '5y';

            const response = await this.marketService.getQuoteHistory(
                symbol,
                range,
                '1d',
            );

            const firstResult = response.results?.[0];
            const raw: BrapiHistoricalPrice[] =
                firstResult?.historicalDataPrice ?? [];

            const series = raw
                .map((bar): { date: Date; close: number } | null => {
                    const ts = bar.date ?? 0;
                    const d = new Date(ts * 1000);
                    const close = bar.close ?? bar.open ?? null;
                    if (close == null) return null;
                    return { date: d, close: Number(close) };
                })
                .filter(
                    (p): p is { date: Date; close: number } =>
                        !!p && !Number.isNaN(p.close),
                )
                .filter(
                    (p) =>
                        p.date.getTime() >= startDate.getTime() &&
                        p.date.getTime() <= endDate.getTime(),
                )
                .sort((a, b) => a.date.getTime() - b.date.getTime());

            if (!series.length) {
                return null;
            }

            return series[0].close;
        } catch (err) {
            this.logger.error(
                `[SimulationsService] Erro ao buscar preço inicial de ${symbol}`,
                err instanceof Error ? err.stack : String(err),
            );
            return null;
        }
    }
}