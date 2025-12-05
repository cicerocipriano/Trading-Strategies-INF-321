import {
    SimulationBacktestResult,
    SimulationContext,
    StrategyExecutionType,
} from './simulation-engine.types';

export interface ISimulationStrategy {
    readonly type: StrategyExecutionType;

    run(context: SimulationContext): Promise<SimulationBacktestResult>;
}