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
