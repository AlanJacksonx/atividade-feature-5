import { IsString, MaxLength, MinLength } from 'class-validator';
export class MascararChamadoDto {
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  texto!: string;
}
