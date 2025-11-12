/**
 * Biblioteca de copies para áudio personalizado
 * Segmentação: Alunos vs Não-Alunos
 */

interface Lead {
  nome: string
  elemento_principal: string
  is_aluno?: boolean
  is_aluno_bny2?: boolean
}

// Mapas de sintomas e soluções por elemento
const sintomasPorElemento: Record<string, string> = {
  'RIM': 'dores nas costas, cansaço extremo e sensação de frio',
  'FÍGADO': 'tensão muscular, irritabilidade e rigidez no corpo',
  'BAÇO': 'digestão difícil, inchaço e peso nas pernas',
  'CORAÇÃO': 'insônia, ansiedade e palpitações',
  'PULMÃO': 'respiração curta, resfriados frequentes e cansaço'
}

const solucoesPorElemento: Record<string, string> = {
  'RIM': 'fortalecer sua energia vital e recuperar a vitalidade que você perdeu',
  'FÍGADO': 'liberar toda essa tensão acumulada e voltar a ter leveza no corpo',
  'BAÇO': 'reequilibrar sua digestão e ter mais disposição no dia a dia',
  'CORAÇÃO': 'acalmar sua mente, dormir bem e recuperar sua paz interior',
  'PULMÃO': 'fortalecer sua respiração e aumentar sua imunidade'
}

const elementoPronuncia: Record<string, string> = {
  'RIM': 'rim',
  'FÍGADO': 'fígado',
  'BAÇO': 'baço',
  'CORAÇÃO': 'coração',
  'PULMÃO': 'pulmão'
}

/**
 * Copy para NÃO-ALUNOS
 * Tom: Vendas diretas, urgência, escassez
 */
function copyNaoAlunos(
  primeiroNome: string,
  elementoFalado: string,
  sintomas: string,
  solucao: string
): string {
  return `Oi ${primeiroNome}, aqui é o Mestre Ye.

Eu analisei seu diagnóstico e percebi a deficiência de ${elementoFalado}.

Sei exatamente o que você está passando com ${sintomas}.

Não deve ser fácil conviver com isso todos os dias.

Mas a boa notícia é que eu sei como ${solucao}.

E é exatamente isso que você vai alcançar ao garantir o SUPER COMBO Vitalício hoje.

Essa oferta é histórica! Eu nunca fiz nada igual.

${primeiroNome}, essa é a última turma. É a sua chance. Não espera seus sintomas piorarem pra você se arrepender.

Clica no link que eu vou te mandar agora para garantir a sua vaga antes que seja tarde.

A minha equipe tá querendo fechar as inscrições em breve, porque estamos chegando no nosso limite de alunos.

Posso contar com você na nossa turma?`
}

/**
 * Copy para ALUNOS
 * Tom: Reativação, benefício tangível, urgência legítima, estrutura PAS
 */
function copyAlunos(
  primeiroNome: string,
  elementoFalado: string,
  sintomas: string,
  solucao: string
): string {
  return `Oi ${primeiroNome}, aqui é o Mestre Ye.

Como você já confiou no meu trabalho no passado, decidi dedicar um tempo para analisar seu diagnóstico hoje e notei alguns sinais de desequilíbrio em ${elementoFalado}.

Provavelmente você tem sentido ${sintomas}.

E sei exatamente como ${solucao} — porque você já viu meu método funcionar antes.

${primeiroNome}, preparei uma condição exclusiva para alunos e ex-alunos aproveitarem o SUPER COMBO VITALÍCIO.

É a mesma transformação que você já conhece, só que agora com acesso PERMANENTE a tudo que você precisa para manter os resultados para sempre.

Mas preciso te avisar: essa é a última turma com esse pacote tão completo e vitalício.

Depois disso, não vai ter mais essa condição.

Se faz sentido pra você garantir esse acesso agora, clica no link que vou te mandar.

A minha equipe tá fechando as vagas em breve porque já estamos no limite.

Posso contar com você nessa turma?`
}

/**
 * Gera script personalizado para um lead
 * Detecta automaticamente se é aluno ou não
 */
export function gerarScriptParaLead(lead: Lead): { script: string; scriptType: string } {
  const primeiroNome = lead.nome.split(' ')[0]
  const elemento = (lead.elemento_principal || 'CORAÇÃO').toUpperCase()
  
  const elementoFalado = elementoPronuncia[elemento] || elemento.toLowerCase()
  const sintomas = sintomasPorElemento[elemento] || 'desconfortos e dores'
  const solucao = solucoesPorElemento[elemento] || 'reequilibrar sua energia'
  
  // Seleção automática baseada em is_aluno ou is_aluno_bny2
  const isAluno = lead.is_aluno === true || lead.is_aluno_bny2 === true
  
  const script = isAluno
    ? copyAlunos(primeiroNome, elementoFalado, sintomas, solucao)
    : copyNaoAlunos(primeiroNome, elementoFalado, sintomas, solucao)
  
  const scriptType = isAluno ? 'ALUNO' : 'NÃO-ALUNO'
  
  return { script, scriptType }
}

/**
 * Normaliza telefone para formato E.164
 * Entrada: "11998457676", "(11) 99845-7676", "+5511998457676"
 * Saída: "+5511998457676"
 */
export function normalizarTelefone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  
  if (digits.startsWith('55')) {
    return '+' + digits
  } else if (digits.length === 11) {
    return '+55' + digits
  } else {
    throw new Error('Formato de telefone inválido')
  }
}
