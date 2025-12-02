/**
 * Ponto de entrada da aplicação. Inicializa o servidor NestJS e configura
 * middlewares, filtros de exceção e outras configurações globais.
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
dotenv.config();

import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const corsOriginsEnv = process.env.CORS_ORIGIN;

    const allowedOrigins = corsOriginsEnv
        ? corsOriginsEnv.split(',').map((origin) => origin.trim())
        : ['http://localhost:5173'];

    console.log('CORS allowed origins:', allowedOrigins);

    app.enableCors({
        origin: allowedOrigins,
        credentials: true,
    });

    // Validação global de DTOs
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // Prefixo global de rotas
    app.setGlobalPrefix('api');

    const port = process.env.PORT || process.env.SERVER_PORT || 3001;

    await app.listen(port, () => {
        const host =
            process.env.NODE_ENV === 'production'
                ? '0.0.0.0'
                : 'localhost';

        console.log(`
    ╔════════════════════════════════════════════════════════════╗
    ║                                                            ║
    ║   Trading Strategies API - NestJS                          ║
    ║                                                            ║
    ║   Server rodando em: http://${host}:${port}                   ║
    ║                                                            ║
    ║   Endpoints disponíveis:                                   ║
    ║   - GET    /api/strategies                                 ║
    ║   - GET    /api/strategies/:id                             ║
    ║   - GET    /api/simulations/user/:userId                   ║
    ║   - GET    /api/users/:id/profile                          ║
    ║   - GET    /api/auth/me                                    ║
    ║                                                            ║
    ║   Documentação: http://${host}:${port}/api/docs               ║
    ║                                                            ║
    ╚════════════════════════════════════════════════════════════╝
    ` );
    });
}

bootstrap().catch((error) => {
    console.error('Erro ao iniciar aplicação:', error);
    process.exit(1);
});