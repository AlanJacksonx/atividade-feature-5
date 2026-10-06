New-Item -Path "src\mascaramento\dto" -ItemType Directory -Force | Out-Null
New-Item -Path "src\mascaramento\avaliacao" -ItemType Directory -Force | Out-Null

# 1. Prompt de Mascaramento (Engenharia para forçar JSON estruturado)
Set-Content -Path "src\mascaramento\mascaramento.prompt.ts" -Encoding UTF8 -Value @'
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
7. RESPONDA APENAS COM O JSON, sem blocos de markdown (```json), sem explicações, sem texto antes ou depois.

Formato JSON exigido:
{
  "textoMascarado": "string",
  "tiposDetectados": ["EMAIL", "CPF", etc],
  "quantidadeOcorrencias": numero,
  "casosAmbiguos": booleano,
  "revisaoHumana": booleano
}

<chamado>
${texto.trim()}
</chamado>
  `.trim();
}
'@

# 2. DTO
Set-Content -Path "src\mascaramento\dto\mascarar-chamado.dto.ts" -Encoding UTF8 -Value @'
import { IsString, MaxLength, MinLength } from 'class-validator';
export class MascararChamadoDto {
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  texto!: string;
}
'@

# 3. Service Principal (Com validação defensiva rigorosa)
Set-Content -Path "src\mascaramento\mascaramento.service.ts" -Encoding UTF8 -Value @'
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
'@

# 4. Controller
Set-Content -Path "src\mascaramento\mascaramento.controller.ts" -Encoding UTF8 -Value @'
import { Body, Controller, Post } from '@nestjs/common';
import { MascararChamadoDto } from './dto/mascarar-chamado.dto';
import { MascaramentoService } from './mascaramento.service';

@Controller('mascaramento')
export class MascaramentoController {
  constructor(private readonly mascaramentoService: MascaramentoService) {}

  @Post('processar')
  processar(@Body() dto: MascararChamadoDto) {
    return this.mascaramentoService.processar(dto.texto);
  }
}
'@

# 5. Casos de Avaliação (Os 5 cenários obrigatórios)
Set-Content -Path "src\mascaramento\avaliacao\casos-mascaramento.ts" -Encoding UTF8 -Value @'
export interface CasoMascaramento {
  id: string;
  texto: string;
  descricao: string;
}

export const CASOS_MASCARAMENTO: CasoMascaramento[] = [
  { id: 'cenario-1', descricao: 'Texto sem dados sensíveis', texto: 'Minha internet caiu ontem à noite e a luz do roteador está vermelha. Podem ajudar?' },
  { id: 'cenario-2', descricao: 'Texto com e-mail e telefone', texto: 'Por favor, entrem em contato pelo email joao@empresa.com ou me liguem no 84 99999-8888.' },
  { id: 'cenario-3', descricao: 'Texto com CPF', texto: 'Preciso da segunda via do meu contrato. O titular é Maria, CPF 123.456.789-00.' },
  { id: 'cenario-4', descricao: 'Texto com senha ou token', texto: 'Não consigo logar no sistema. Minha senha atual é admin123! e o token de acesso que gerou foi abcXYZ789.' },
  { id: 'cenario-5', descricao: 'Sequência numérica ambígua', texto: 'O roteador pifou. O número de série na etiqueta atrás dele é 748291048572019.' }
];
'@

# 6. Avaliador Service
Set-Content -Path "src\mascaramento\avaliacao\avaliador-mascaramento.service.ts" -Encoding UTF8 -Value @'
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
          erro: error instanceof Error ? error.message : 'Erro',
          duracaoMs: Math.round(performance.now() - inicio)
        });
      }
    }
    
    const sucessos = resultados.filter((item) => item.sucesso).length;

    return {
      total: resultados.length,
      validadosComSucesso: sucessos,
      resultados
    };
  }
}
'@

# 7. Executor
Set-Content -Path "src\mascaramento\avaliacao\executar-mascaramento.ts" -Encoding UTF8 -Value @'
import { writeFile } from 'node:fs/promises';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { AvaliadorMascaramentoService } from './avaliador-mascaramento.service';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const avaliador = app.get(AvaliadorMascaramentoService);
    const relatorio = await avaliador.executar();
    await writeFile('resultado-mascaramento.json', JSON.stringify(relatorio, null, 2));
    
    console.table(relatorio.resultados.map(r => ({
      Cenário: r.id,
      Ocorrências: r.ocorrencias,
      Revisão_Humana: r.revisao,
      Status: r.sucesso ? 'OK (JSON Válido)' : 'FALHA',
    })));
    
    console.log(`\n=> Total Executado: ${relatorio.total} | Validados com Sucesso (Contrato JSON): ${relatorio.validadosComSucesso}`);
  } finally {
    await app.close();
  }
}
void main();
'@

# 8. Módulo
Set-Content -Path "src\mascaramento\mascaramento.module.ts" -Encoding UTF8 -Value @'
import { Module } from '@nestjs/common';
import { IaModule } from '../ia/ia.module';
import { AvaliadorMascaramentoService } from './avaliacao/avaliador-mascaramento.service';
import { MascaramentoController } from './mascaramento.controller';
import { MascaramentoService } from './mascaramento.service';

@Module({
  imports: [IaModule],
  controllers: [MascaramentoController],
  providers: [MascaramentoService, AvaliadorMascaramentoService],
  exports: [AvaliadorMascaramentoService],
})
export class MascaramentoModule {}
'@

Write-Host "Módulo Mascaramento (Feature 5) gerado com sucesso!" -ForegroundColor Green