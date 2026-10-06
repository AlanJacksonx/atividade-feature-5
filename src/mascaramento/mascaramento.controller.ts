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
