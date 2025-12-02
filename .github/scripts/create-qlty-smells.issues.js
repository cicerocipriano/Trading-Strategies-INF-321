const fs = require('fs');
const path = require('path');

/**
 * Cria issues de smells com base nos relatórios SARIF gerados pelo Qlty.
 *
 * Executado via actions/github-script, que injeta:
 *   { github, context, core }.
 *
 * @param {object} params
 * @param {import('@actions/github').GitHub} params.github
 * @param {typeof import('@actions/github').context} params.context
 * @param {typeof import('@actions/core')} params.core
 */
module.exports = async function createQltySmellIssues({
    github,
    context,
    core,
}) {
    const workspace = process.env.GITHUB_WORKSPACE || process.cwd();

    const reports = [
        { file: 'server_report.json', prefix: 'apps/server' },
        { file: 'client_report.json', prefix: 'apps/client' },
    ];

    const issuesToCreate = [];

    for (const { file, prefix } of reports) {
        const reportPath = path.join(workspace, file);

        if (!fs.existsSync(reportPath)) {
            core.info(`Relatório Qlty não encontrado (${reportPath}). Pulando ${prefix}...`);
            continue;
        }

        const stat = fs.statSync(reportPath);
        if (!stat.size) {
            core.info(`Relatório Qlty vazio (${reportPath}). Pulando ${prefix}...`);
            continue;
        }

        core.info(`Lendo relatório Qlty/SARIF em: ${reportPath}`);

        let sarif;
        try {
            sarif = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        } catch (err) {
            core.warning(`Falha ao parsear SARIF em ${reportPath}: ${err.message}`);
            continue;
        }

        const runs = sarif.runs || [];
        if (!runs.length) {
            core.info(`Nenhum "run" encontrado em ${reportPath}.`);
            continue;
        }

        for (const run of runs) {
            const driver = run.tool && run.tool.driver ? run.tool.driver : {};
            const rules = driver.rules || [];

            const ruleTagsMap = new Map();
            for (const rule of rules) {
                const id = rule.id;
                const tags = (rule.properties && rule.properties.tags) || [];
                if (id) {
                    ruleTagsMap.set(id, tags);
                }
            }

            const results = run.results || [];
            for (const result of results) {
                const ruleId = result.ruleId || 'unknown-rule';
                const level = result.level || 'warning';

                let messageText = '';
                if (result.message) {
                    if (typeof result.message.text === 'string') {
                        messageText = result.message.text;
                    } else {
                        messageText = JSON.stringify(result.message);
                    }
                }

                const firstLocation =
                    (result.locations && result.locations[0]) || {};
                const physicalLocation = firstLocation.physicalLocation || {};
                const artifactLocation = physicalLocation.artifactLocation || {};
                const region = physicalLocation.region || {};

                const uri = artifactLocation.uri || 'UNKNOWN_FILE';
                const line = region.startLine || 1;

                const fileUri = `${prefix}/${uri}`;

                const tags = ruleTagsMap.get(ruleId) || [];
                const tagsJoined = tags.join(',').toLowerCase();

                let type = 'CODE_SMELL';
                let extraLabels = ['Code-smell', 'Refatorar'];

                if (tagsJoined.includes('security') || tagsJoined.includes('vulnerability')) {
                    type = 'VULNERABILITY';
                    extraLabels = ['Segurança'];
                } else if (tagsJoined.includes('bug') || level === 'error') {
                    type = 'BUG';
                    extraLabels = ['Bug'];
                }

                const title = `[Qlty ${type}] ${ruleId} em ${fileUri}`;

                const body = `
                            **Detalhes do Débito Técnico (${prefix})**

                            - **Tipo (Sonar-style):** ${type}
                            - **Regra:** \`${ruleId}\`
                            - **Arquivo:** \`${fileUri}\`
                            - **Linha:** ${line}
                            - **Nível (SARIF):** ${level}
                            - **Tags (QLTY/SARIF):** ${tags.join(', ') || '(nenhuma)'}

                            ---

                            **Mensagem do Qlty:**
                            ${messageText}

                            Criado automaticamente pelo pipeline de CI (job \`qlty-smells\`).
                            `.trim();

                const labels = ['Débito-técnico', ...extraLabels];

                issuesToCreate.push({
                    title,
                    body,
                    labels,
                });
            }
        }
    }

    if (!issuesToCreate.length) {
        core.info('Nenhum smell Qlty encontrado para criação de issues.');
        return;
    }

    core.info(`Total bruto de smells Qlty encontrados: ${issuesToCreate.length}`);

    // Evita issues duplicadas: busca issues abertas com label "Débito-técnico"
    const existingIssues = await github.paginate(
        github.rest.issues.listForRepo,
        {
            owner: context.repo.owner,
            repo: context.repo.repo,
            labels: 'Débito-técnico',
            state: 'open',
            per_page: 100,
        }
    );

    const existingTitles = new Set(existingIssues.map(i => i.title));
    const MAX_ISSUES = 50;
    let created = 0;

    for (const issue of issuesToCreate) {
        if (existingTitles.has(issue.title)) {
            core.info(`Issue já existe (QLTY): ${issue.title}`);
            continue;
        }

        if (created >= MAX_ISSUES) {
            core.warning(
                `Limite de ${MAX_ISSUES} issues Qlty atingido neste run. Outras ocorrências serão ignoradas.`
            );
            break;
        }

        await github.rest.issues.create({
            owner: context.repo.owner,
            repo: context.repo.repo,
            title: issue.title,
            body: issue.body,
            labels: issue.labels,
        });

        created++;
        existingTitles.add(issue.title);
        core.info(`Issue Qlty criada: ${issue.title}`);
    }

    core.info(`Total de issues Qlty criadas neste run: ${created}`);
};
