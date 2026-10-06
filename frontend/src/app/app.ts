import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  mensagem = '';
  resposta = '';
  status: 'idle' | 'streaming' | 'error' = 'idle';
  private abortController: AbortController | null = null;

  async enviar() {
    if (!this.mensagem.trim()) return;

    this.resposta = '🛡️ A analisar dados sensíveis...';
    this.status = 'streaming';
    this.abortController = new AbortController();

    try {
      // Chamada para a nova rota da Feature 5
      const res = await fetch('http://localhost:3000/mascaramento/processar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: this.mensagem }), // O DTO usa 'texto'
        signal: this.abortController.signal,
      });

      if (!res.ok) {
        throw new Error('Falha na comunicação com o backend');
      }

      // Lê a resposta estruturada em JSON
      const data = await res.json();
      
      // Formata a exibição no chat
      this.resposta = 
`🔒 TEXTO PROTEGIDO:
${data.textoMascarado}

📊 RELATÓRIO DE SEGURANÇA:
- Tipos detetados: ${data.tiposDetectados?.length > 0 ? data.tiposDetectados.join(', ') : 'Nenhum'}
- Ocorrências: ${data.quantidadeOcorrencias}
- Revisão Humana: ${data.revisaoHumana ? '⚠️ Sim (Dado Ambíguo)' : 'Não'}`;

      this.status = 'idle';
      this.mensagem = ''; // Limpa o input após o envio
    } catch (error: any) {
      if (error.name === 'AbortError') {
        this.resposta = '⛔ Análise cancelada pelo utilizador.';
        this.status = 'idle';
      } else {
        console.error(error);
        this.resposta = '❌ Erro ao processar o mascaramento. O backend rejeitou a resposta ou a IA falhou.';
        this.status = 'error';
      }
    } finally {
      this.abortController = null;
    }
  }

  cancelar() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}