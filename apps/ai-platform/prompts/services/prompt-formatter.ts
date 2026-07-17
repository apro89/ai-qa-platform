import { createLogger } from '../../logger/index.js';
import type { PromptSection } from '../models/PromptSection.js';

interface FormattedSection {
  title: string;
  content: string;
  fullText: string;
}

export class PromptFormatter {
  private logger = createLogger('PromptFormatter');
  private readonly MAX_LINE_LENGTH = 100;
  private readonly SECTION_SEPARATOR = '\n\n';

  formatSection(section: PromptSection, headingLevel: 1 | 2 | 3 = 2): FormattedSection {
    const heading = this.formatHeading(section.title, headingLevel);
    const formattedContent = this.formatContent(section.content);
    const fullText = `${heading}\n${formattedContent}`;

    return { title: section.title, content: formattedContent, fullText };
  }

  formatSections(sections: PromptSection[], headingLevel: 1 | 2 | 3 = 2): string {
    return sections
      .map(section => this.formatSection(section, headingLevel).fullText)
      .join(this.SECTION_SEPARATOR);
  }

  private formatHeading(text: string, level: 1 | 2 | 3 = 2): string {
    const markers = { 1: '#', 2: '##', 3: '###' };
    return `${markers[level]} ${text}`;
  }

  private formatContent(text: string): string {
    let formatted = text.replace(/\r\n/g, '\n');
    formatted = this.preserveCodeBlocks(formatted);
    formatted = this.formatParagraphs(formatted);
    formatted = this.fixSpacing(formatted);
    return formatted.trim();
  }

  private preserveCodeBlocks(text: string): string {
    const codeBlockRegex = /```(typescript|javascript|ts|js|.*?)?\n([\s\S]*?)```/g;
    return text.replace(codeBlockRegex, (match: string, language: string, code: string) => {
      const lang = language || 'typescript';
      const trimmedCode = code.trim();
      return `\`\`\`${lang}\n${trimmedCode}\n\`\`\``;
    });
  }

  private formatParagraphs(text: string): string {
    const lines = text.split('\n');
    const formatted: string[] = [];

    for (const line of lines) {
      if (line.match(/^[-*]\s/)) {
        formatted.push(line);
      } else if (line.match(/^\d+\.\s/)) {
        formatted.push(line);
      } else if (line.trim().length === 0) {
        formatted.push('');
      } else {
        formatted.push(...this.wrapLine(line));
      }
    }

    return formatted.join('\n');
  }

  private wrapLine(line: string): string[] {
    if (line.length <= this.MAX_LINE_LENGTH) {
      return [line];
    }

    const wrapped: string[] = [];
    let current = '';

    const words = line.split(' ');
    for (const word of words) {
      if ((current + ' ' + word).length <= this.MAX_LINE_LENGTH) {
        current = current ? current + ' ' + word : word;
      } else {
        if (current) {
          wrapped.push(current);
        }
        current = word;
      }
    }

    if (current) {
      wrapped.push(current);
    }

    return wrapped;
  }

  private fixSpacing(text: string): string {
    let formatted = text.split('\n').map(line => line.trimEnd()).join('\n');
    formatted = formatted.replace(/\n\n\n+/g, '\n\n');
    formatted = formatted.replace(/^\n+/, '');
    formatted = formatted.replace(/\n+$/, '');
    return formatted;
  }

  formatForDisplay(text: string, addLineNumbers: boolean = false): string {
    let formatted = text;

    if (addLineNumbers) {
      const lines = text.split('\n');
      formatted = lines.map((line, i) => `${String(i + 1).padStart(3)} | ${line}`).join('\n');
    }

    return formatted;
  }

  estimateTokens(text: string): number {
    const words = text.split(/\s+/).length;
    return Math.ceil(words * 1.3);
  }
}
