import type { Locale } from './config';

/** Long-form page copy approved by Gonçalo on 2026-10-02 (Início and Sobre). */
export interface PageCopy {
  home: {
    kicker: string;
    title: string;
    lead: string;
    photoAlt: string;
    featuredLabel: string;
    featuredTitle: string;
    featuredText: string;
    featuredLink: string;
    aboutLink: string;
  };
  about: {
    title: string;
    photoAlt: string;
    paragraphs: readonly string[];
    toolsTitle: string;
    tools: readonly { group: string; items: readonly string[] }[];
    languagesTitle: string;
    languages: readonly { name: string; level: string }[];
  };
}

export const copy: Record<Locale, PageCopy> = {
  pt: {
    home: {
      kicker: 'Designer e developer web · Sever do Vouga, Portugal',
      title: 'Desenho e construo produtos digitais, do primeiro esboço ao deploy.',
      lead: 'Antes de escrever código, gosto de perceber como o problema funciona por dentro.',
      photoAlt: 'Retrato de Gonçalo Guerra a preto e branco, em contraluz.',
      featuredLabel: 'Trabalho em destaque',
      featuredTitle: 'Don Gonçalo — da cozinha ao código.',
      featuredText:
        'Fui pizzaiolo no restaurante; depois desenhei e construí a plataforma dele: carta digital, pratos do dia, reservas e backoffice.',
      featuredLink: 'Ver trabalho',
      aboutLink: 'Sobre mim',
    },
    about: {
      title: 'Sobre',
      photoAlt: 'Gonçalo Guerra a preto e branco, em contraluz, de cabeça inclinada para baixo.',
      paragraphs: [
        'Sou o Gonçalo, designer e developer web, licenciado em Tecnologias e Design de Multimédia pela ESTG de Viseu.',
        'Antes do código, trabalhei em restauração, como empregado de mesa, ajudante de cozinha e sobretudo pizzaiolo, e numa carpintaria, a operar uma máquina CNC. Da cozinha trouxe o ritmo e a atenção a quem está do outro lado. Da CNC, a precisão de transformar instruções digitais em coisas reais.',
        'Hoje desenho e desenvolvo produtos web de ponta a ponta, da interface ao backend e ao deploy. A fotografia e o design gráfico continuam a ser a forma como olho para tudo o resto.',
        'Estou aberto a oportunidades em equipa e a projetos freelance.',
      ],
      toolsTitle: 'Ferramentas',
      tools: [
        { group: 'Frontend', items: ['HTML', 'CSS', 'TypeScript', 'React', 'Astro', 'Tailwind CSS', 'Vite'] },
        { group: 'Backend', items: ['Node.js', 'Express', 'Prisma', 'PostgreSQL', 'Zod'] },
        { group: 'Deploy', items: ['Vercel', 'Railway', 'Neon', 'Cloudflare'] },
        { group: 'Criativo', items: ['WebGL (OGL)', 'Unity'] },
        {
          group: 'Design e imagem',
          items: ['Illustrator', 'Photoshop', 'Premiere', 'Fotografia', 'Motion graphics'],
        },
      ],
      languagesTitle: 'Línguas',
      languages: [
        { name: 'Português', level: 'nativo' },
        { name: 'Inglês', level: 'avançado' },
        { name: 'Espanhol', level: 'básico' },
        { name: 'Japonês', level: 'iniciação' },
      ],
    },
  },
  en: {
    home: {
      kicker: 'Web designer and developer · Sever do Vouga, Portugal',
      title: 'I design and build digital products, from first sketch to deploy.',
      lead: 'Before writing code, I like to understand how the problem works from the inside.',
      photoAlt: 'Portrait of Gonçalo Guerra in black and white, backlit.',
      featuredLabel: 'Featured work',
      featuredTitle: 'Don Gonçalo — from kitchen to code.',
      featuredText:
        "I was the restaurant's pizzaiolo; then I designed and built its platform: digital menu, daily dishes, reservations and back office.",
      featuredLink: 'See work',
      aboutLink: 'About me',
    },
    about: {
      title: 'About',
      photoAlt: 'Gonçalo Guerra in black and white, backlit, head tilted down.',
      paragraphs: [
        "I'm Gonçalo, a web designer and developer with a degree in Multimedia Technologies and Design from ESTG Viseu.",
        'Before code, I worked in restaurants, as a waiter, kitchen assistant and above all as a pizzaiolo, and in a carpentry shop, running a CNC machine. The kitchen taught me pace and attention to the person on the other side. The CNC taught me the precision of turning digital instructions into real things.',
        'Today I design and build web products end to end, from interface to backend and deploy. Photography and graphic design are still how I look at everything else.',
        "I'm open to team roles and freelance projects.",
      ],
      toolsTitle: 'Tools',
      tools: [
        { group: 'Frontend', items: ['HTML', 'CSS', 'TypeScript', 'React', 'Astro', 'Tailwind CSS', 'Vite'] },
        { group: 'Backend', items: ['Node.js', 'Express', 'Prisma', 'PostgreSQL', 'Zod'] },
        { group: 'Deploy', items: ['Vercel', 'Railway', 'Neon', 'Cloudflare'] },
        { group: 'Creative', items: ['WebGL (OGL)', 'Unity'] },
        {
          group: 'Design and image',
          items: ['Illustrator', 'Photoshop', 'Premiere', 'Photography', 'Motion graphics'],
        },
      ],
      languagesTitle: 'Languages',
      languages: [
        { name: 'Portuguese', level: 'native' },
        { name: 'English', level: 'advanced' },
        { name: 'Spanish', level: 'basic' },
        { name: 'Japanese', level: 'beginner' },
      ],
    },
  },
};
