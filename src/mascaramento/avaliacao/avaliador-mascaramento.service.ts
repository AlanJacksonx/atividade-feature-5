import { Injectable } from '@nestjs/common';
import { MascaramentoService } from '../mascaramento.service';
import { CASOS_MASCARAMENTO } from './casos-mascaramento';

@Injectable()
export class AvaliadorMascaramentoService {
  constructor(private readonly mascaramento: MascaramentoService) {}
  
  async executar() {
    const resultados: any[] = [];
    
    for (const caso of CASOS_MASCARAMENTO) {
      const inicio = performance.now();
      try {
        const resposta = await this.mascaramento.processar(caso.texto);
        
        // NOVO: TESTE RIGOROSO DE VAZAMENTO DE DADOS (Asserção Semântica)
        if (caso.textoProibido && resposta.textoMascarado.includes(caso.textoProibido)) {
          throw new Error(`FALHA CRÍTICA DE SEGURANÇA: O dado "${caso.textoProibido}" vazou!`);
        }

        resultados.push({
          id: caso.id,
          descricao: caso.descricao,
          original: caso.texto,
          mascarado: resposta.textoMascarado,
          tipos: resposta.tiposDetectados.join(', ') || 'NENHUM',
          ocorrencias: resposta.quantidadeOcorrencias,
          ambiguo: resposta.casosAmbiguos,
          revisao: resposta.revisaoHumana,
          sucesso: true,
          erro: null,
          duracaoMs: Math.round(performance.now() - inicio)
        });
      } catch (error) {
        resultados.push({
          id: caso.id,
          descricao: caso.descricao,
          original: caso.texto,
          mascarado: null,
          tipos: null,
          ocorrencias: null,
          ambiguo: null,
          revisao: null,
          sucesso: false,
          erro: error instanceof Error ? error.message : 'Erro Desconhecido',
          duracaoMs: Math.round(performance.now() - inicio)
        });
      }
    }
    
    const sucessos = resultados.filter((item) => item.sucesso).length;

    return { total: resultados.length, validadosComSucesso: sucessos, resultados };
  }
}
