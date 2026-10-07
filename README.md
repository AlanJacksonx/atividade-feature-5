Markdown

#  Feature 5: Módulo de Mascaramento de Dados (DLP) com IA Local

Este repositório contém a implementação da **Feature 5**, um sistema de prevenção de perda de dados (Data Loss Prevention - DLP) projetado para anonimizar informações sensíveis em chamados de suporte técnico, garantindo conformidade com a LGPD.

**Autores:** Alan Jackson Silva de Medeiros e Daniel Augusto Silva de Goes  
**Professor:** Luciano Alexandre  

---

##  O Projeto

O objetivo deste módulo é atuar como um *middleware* de segurança. Ele intercepta textos de chamados submetidos pelos utilizadores, localiza Dados Pessoais Identificáveis (PIIs) e substitui-os por tags estruturadas (ex: `[CPF]`, `[EMAIL]`), sem alterar o contexto semântico da frase.

**Regra de Negócio Principal:** Em respeito ao Princípio da Responsabilidade Única, esta feature **não** interage, resume ou responde ao utilizador. A sua única função é limpar o dado e devolver um contrato JSON rigoroso para as próximas etapas do pipeline do sistema.

##  Arquitetura e Segurança (Escudo Duplo)

Como Modelos de Linguagem (LLMs) são probabilísticos e suscetíveis a ataques de *Prompt Injection*, implementámos uma arquitetura de **Programação Defensiva** em duas camadas:

1. **Asserção Semântica (IA):** 
   Utilizamos o **Llama 3.2 (3B)** via Ollama com técnicas de *Few-Shot Prompting*. A IA atua como uma API, sendo proibida de gerar texto livre, respondendo exclusivamente no formato de um contrato JSON predefinido.
   
2. **Interceção Determinística (Regex no Backend):**
   O backend em **NestJS** não confia cegamente no modelo. Ao receber a resposta da IA, o servidor valida o JSON e aplica Expressões Regulares (Regex) para procurar vazamentos. Se a IA falhar e tentar devolver um CPF ou E-mail real, o NestJS aborta a requisição e lança uma exceção `502 Bad Gateway`, protegendo a aplicação.

##  Tecnologias Utilizadas

*   **Backend:** NestJS, TypeScript
*   **Frontend:** Angular
*   **Inteligência Artificial:** Ollama (Llama 3.2 3B Instruct) local
*   **Testes:** Jest

##  Como Executar o Projeto

1. **Subir os serviços (Backend, Frontend e Ollama):**
   ```bash
   docker compose up -d

    Aceder à Interface:
    Abra o navegador em http://localhost:4200 e envie um texto com dados sensíveis (ex: O meu CPF é 111.222.333-44).
   ```
 Testes e Validação

O sistema possui uma suíte de testes robusta que comprova a sua segurança sem a dependência do contentor da IA ligado:

    Testes Unitários (Com Mock):
    Simula a resposta da IA e testa o comportamento de interceção do NestJS.
    Bash

    npm run test

    Avaliação de Segurança (Stress Test & Prompt Injection):
    Um script com 8 cenários complexos (incluindo tentativas de enganar a IA para vazar dados).
    Bash

    docker compose exec backend npm run avaliar:mascaramento

Projeto desenvolvido para fins académicos.
