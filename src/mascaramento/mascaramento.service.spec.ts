import { BadGatewayException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { MODELO_PROVIDER } from "../ia/providers/modelo.provider";
import { MascaramentoService } from "./mascaramento.service";

describe("MascaramentoService (Sem modelo real)", () => {
  let service: MascaramentoService;
  
  // Criamos um "Ollama Falso" (Mock) para o teste
  const mockModeloProvider = {
    gerar: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MascaramentoService,
        { provide: MODELO_PROVIDER, useValue: mockModeloProvider },
      ],
    }).compile();

    service = module.get<MascaramentoService>(MascaramentoService);
  });

  it("deve processar o mascaramento com sucesso retornando JSON valido", async () => {
    // Simulamos a IA a devolver um JSON perfeito
    mockModeloProvider.gerar.mockResolvedValueOnce({
      resposta: JSON.stringify({
        textoMascarado: "O meu email é [EMAIL]",
        tiposDetectados: ["EMAIL"],
        quantidadeOcorrencias: 1,
        casosAmbiguos: false,
        revisaoHumana: false
      })
    });

    const resultado = await service.processar("O meu email é teste@teste.com");
    expect(resultado.textoMascarado).toBe("O meu email é [EMAIL]");
    expect(resultado.quantidadeOcorrencias).toBe(1);
  });

  it("deve lançar BadGatewayException se a IA não retornar JSON", async () => {
    // Simulamos a IA a "alucinar" com texto livre
    mockModeloProvider.gerar.mockResolvedValueOnce({
      resposta: "Olá! Eu mascarei o texto: O meu email é [EMAIL]."
    });

    await expect(service.processar("O meu email é teste@teste.com")).rejects.toThrow(BadGatewayException);
  });
});
