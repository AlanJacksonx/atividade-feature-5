import { BadGatewayException, Inject, Injectable } from '@nestjs/common';
import { MODELO_PROVIDER, type ModeloProvider } from '../ia/providers/modelo.provider';
import { buildMascaramentoPrompt } from './mascaramento.prompt';

export interface MascaramentoResultado {
  textoMascarado: string;
  tiposDetectados: string[];
  quantidadeOcorrencias: number;
  casosAmbiguos: boolean;
  revisaoHumana: boolean;
}

@Injectable()
export class MascaramentoService {
  constructor(@Inject(MODELO_PROVIDER) private readonly modelo: ModeloProvider) {}

  async processar(textoOriginal: string): Promise<MascaramentoResultado> {
    const prompt = buildMascaramentoPrompt(textoOriginal);
    const resultado = await this.modelo.gerar({ mensagem: prompt });
    
    // Sanitização e Extração de JSON (Programação Defensiva)
    const respostaBruta = resultado.resposta;
    const matchJson = respostaBruta.match(/\{[\s\S]*\}/);
    
    if (!matchJson) {
      throw new BadGatewayException('O modelo não retornou um formato JSON estruturado.');
    }

    try {
      const data = JSON.parse(matchJson[0]);
      
      // Validação do Contrato Estruturado (Critério de Aceite)
      if (
        typeof data.textoMascarado !== 'string' ||
        !Array.isArray(data.tiposDetectados) ||
        typeof data.quantidadeOcorrencias !== 'number' ||
        typeof data.casosAmbiguos !== 'boolean' ||
        typeof data.revisaoHumana !== 'boolean'
      ) {
        throw new Error('JSON ausente de campos obrigatórios');
      }

      return data as MascaramentoResultado;
    } catch (error) {
      throw new BadGatewayException(`Falha ao processar resposta da IA: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
}
