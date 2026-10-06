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
    
    const matchJson = resultado.resposta.match(/\{[\s\S]*\}/);
    
    if (!matchJson) {
      throw new BadGatewayException('O modelo não retornou um formato JSON estruturado.');
    }

    try {
      const data = JSON.parse(matchJson[0]) as MascaramentoResultado;
      
      // 1. Validação Estrutural (Contrato JSON)
      if (typeof data.textoMascarado !== 'string' || !Array.isArray(data.tiposDetectados)) {
        throw new Error('JSON ausente de campos obrigatórios');
      }

      // 2. PROTEÇÃO DE SEGURANÇA (Verificação via Regex no Backend)
      // Procura padrões de CPF ou E-mail que a IA tenha "esquecido" de mascarar
      const cpfRegex = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/;
      const emailRegex = /\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b/;

      if (cpfRegex.test(data.textoMascarado) || emailRegex.test(data.textoMascarado)) {
        throw new BadGatewayException('A IA falhou gravemente ao mascarar os dados. Vazamento interceptado pelo backend.');
      }

      return data;
    } catch (error) {
      throw new BadGatewayException(`Falha ao processar: ${error instanceof Error ? error.message : 'Erro'}`);
    }
  }
}