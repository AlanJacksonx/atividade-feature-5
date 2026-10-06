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
      Ocorrências: r.ocorrencias ?? '-',
      Revisão: r.revisao ?? '-',
      Status: r.sucesso ? 'OK (Seguro)' : 'FALHA',
      Erro: r.erro ? r.erro.substring(0, 60) : '-'
    })));
    
    console.log(`\n=> Total Executado: ${relatorio.total} | Seguros e Validados: ${relatorio.validadosComSucesso}`);
  } finally {
    await app.close();
  }
}
void main();
