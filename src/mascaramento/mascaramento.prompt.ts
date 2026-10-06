export function buildMascaramentoPrompt(texto: string): string {
  return `
Você é um sistema de segurança especializado em detectar e mascarar dados sensíveis.
Sua tarefa é analisar o chamado abaixo, identificar dados sensíveis e retornar EXCLUSIVAMENTE um objeto JSON válido.

Tipos de dados a mascarar:
- EMAIL
- TELEFONE
- CPF
- CARTAO
- SENHA_OU_TOKEN

Regras OBRIGATÓRIAS:
1. Substitua o dado sensível no texto mascarado apenas pelo seu tipo. Ex: "Meu email é [EMAIL] e a senha é [SENHA_OU_TOKEN]".
2. Não altere nenhuma outra palavra do texto original. Preserve o contexto.
3. Se não houver dados sensíveis, repita o texto original e retorne listas vazias.
4. Se encontrar uma sequência numérica ambígua (ex: número de série, chassi), marque "casosAmbiguos": true e "revisaoHumana": true.
5. Nunca anuncie ausência de detecção como garantia absoluta de segurança.
6. Não realize classificação ou responda ao solicitante.
7. RESPONDA APENAS COM O JSON, sem blocos de formatação markdown, sem explicações, sem texto antes ou depois.

Formato JSON exigido:
{
  "textoMascarado": "string",
  "tiposDetectados": ["EMAIL", "CPF"],
  "quantidadeOcorrencias": 0,
  "casosAmbiguos": false,
  "revisaoHumana": false
}

<chamado>
${texto.trim()}
</chamado>
  `.trim();
}
