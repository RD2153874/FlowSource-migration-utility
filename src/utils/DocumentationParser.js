// Documentation Parser - Parses markdown documentation and extracts instructions
import fs from 'fs-extra';
import MarkdownIt from 'markdown-it';
import { Logger } from './Logger.js';

export class DocumentationParser {
  constructor() {
    this.logger = Logger.getInstance();
    this.md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true
    });
  }

  async parse(filePath) {
    try {
      this.logger.debug(`📖 Parsing documentation: ${filePath}`);
      
      const content = await fs.readFile(filePath, 'utf8');
      const tokens = this.md.parse(content, {});
      
      const parsed = {
        title: this.extractTitle(tokens),
        sections: this.extractSections(tokens),
        steps: this.extractSteps(tokens),
        codeBlocks: this.extractCodeBlocks(tokens),
        links: this.extractLinks(tokens),
        requirements: this.extractRequirements(tokens),
        rawContent: content
      };
      
      this.logger.debug(`📋 Parsed ${parsed.sections.length} sections, ${parsed.steps.length} steps, ${parsed.codeBlocks.length} code blocks`);
      
      return parsed;
    } catch (error) {
      this.logger.error(`Failed to parse documentation ${filePath}: ${error.message}`);
      throw error;
    }
  }

  extractTitle(tokens) {
    const titleToken = tokens.find(token => 
      token.type === 'heading_open' && token.tag === 'h1'
    );
    
    if (titleToken) {
      const titleIndex = tokens.indexOf(titleToken);
      const contentToken = tokens[titleIndex + 1];
      if (contentToken && contentToken.type === 'inline') {
        return contentToken.content;
      }
    }
    
    return 'Untitled Document';
  }

  extractSections(tokens) {
    const sections = [];
    let currentSection = null;
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      
      if (token.type === 'heading_open' && (token.tag === 'h2' || token.tag === 'h3')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        
        const contentToken = tokens[i + 1];
        currentSection = {
          level: parseInt(token.tag.slice(1)),
          title: contentToken?.content || 'Untitled Section',
          content: [],
          startIndex: i
        };
      } else if (currentSection && token.type !== 'heading_close') {
        currentSection.content.push(token);
      }
    }
    
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections;
  }

  extractSteps(tokens) {
    const steps = [];
    const content = tokens.map(token => token.content || '').join(' ');
    
    // Look for numbered steps
    const stepPatterns = [
      /(?:^|\n)(?:Step )?(\d+)[:.]\s*([^\n]+)/gm,
      /(?:^|\n)###\s*Step\s*(\d+)[:.]\s*([^\n]+)/gm,
      /(?:^|\n)\*\*Step\s*(\d+)\*\*[:.]\s*([^\n]+)/gm
    ];
    
    stepPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        steps.push({
          number: parseInt(match[1]),
          title: match[2].trim(),
          content: match[0]
        });
      }
    });
    
    // Sort by step number and remove duplicates
    return steps
      .sort((a, b) => a.number - b.number)
      .filter((step, index, arr) => 
        index === 0 || step.number !== arr[index - 1].number
      );
  }

  extractCodeBlocks(tokens) {
    const codeBlocks = [];
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      
      if (token.type === 'code_block' || token.type === 'fence') {
        codeBlocks.push({
          language: token.info || 'text',
          content: token.content,
          index: i
        });
      }
    }
    
    return codeBlocks;
  }

  extractLinks(tokens) {
    const links = [];
    
    for (const token of tokens) {
      if (token.type === 'inline' && token.children) {
        for (const child of token.children) {
          if (child.type === 'link_open') {
            const href = child.attrGet('href');
            if (href) {
              links.push({
                url: href,
                text: this.getNextTextContent(child, token.children)
              });
            }
          }
        }
      }
    }
    
    return links;
  }

  extractRequirements(tokens) {
    const requirements = [];
    const content = tokens.map(token => token.content || '').join('\n');
    
    // Look for requirement patterns
    const requirementPatterns = [
      /(?:^|\n)(?:-|\*)\s*\*\*([^*]+)\*\*[:.]\s*([^\n]+)/gm,
      /(?:^|\n)(?:Required?|Prerequisite|Dependencies?):\s*([^\n]+)/gmi,
      /(?:^|\n)\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/gm // Table format
    ];
    
    requirementPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        requirements.push({
          name: match[1]?.trim() || 'Requirement',
          description: match[2]?.trim() || '',
          content: match[0]
        });
      }
    });
    
    return requirements;
  }

  getNextTextContent(startToken, tokens) {
    const startIndex = tokens.indexOf(startToken);
    for (let i = startIndex + 1; i < tokens.length; i++) {
      if (tokens[i].type === 'text') {
        return tokens[i].content;
      }
      if (tokens[i].type === 'link_close') {
        break;
      }
    }
    return '';
  }

  // Extract specific FlowSource instructions
  extractFlowSourceInstructions(parsed) {
    const instructions = {
      fileOperations: [],
      configChanges: [],
      dependencies: [],
      scripts: []
    };
    
    // Extract file operations from code blocks and instructions
    parsed.codeBlocks.forEach(block => {
      if (block.language === 'bash' || block.language === 'shell') {
        const commands = this.parseShellCommands(block.content);
        instructions.scripts.push(...commands);
      } else if (block.language === 'javascript' || block.language === 'typescript') {
        instructions.configChanges.push({
          type: 'code',
          language: block.language,
          content: block.content
        });
      }
    });
    
    // Extract file paths and operations from content
    const filePatterns = [
      /📁\s*\*\*(?:File|Directory)\*\*:\s*`([^`]+)`/g,
      /📄\s*\*\*([^*]+)\*\*\s*-\s*([^\n]+)/g,
      /Copy.*from.*`([^`]+)`.*to.*`([^`]+)`/gi,
      /Replace.*`([^`]+)`/gi
    ];
    
    filePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(parsed.rawContent)) !== null) {
        instructions.fileOperations.push({
          operation: this.detectOperation(match[0]),
          source: match[1],
          destination: match[2] || null,
          description: match[0]
        });
      }
    });
    
    return instructions;
  }

  parseShellCommands(content) {
    const commands = [];
    const lines = content.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        commands.push({
          command: trimmed,
          type: this.detectCommandType(trimmed)
        });
      }
    }
    
    return commands;
  }

  detectOperation(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('copy')) return 'copy';
    if (lowerText.includes('replace')) return 'replace';
    if (lowerText.includes('create')) return 'create';
    if (lowerText.includes('update')) return 'update';
    if (lowerText.includes('delete')) return 'delete';
    return 'unknown';
  }

  detectCommandType(command) {
    const lowerCommand = command.toLowerCase();
    if (lowerCommand.startsWith('npm') || lowerCommand.startsWith('yarn')) return 'package-manager';
    if (lowerCommand.startsWith('git')) return 'version-control';
    if (lowerCommand.includes('install')) return 'install';
    if (lowerCommand.includes('build')) return 'build';
    if (lowerCommand.includes('start') || lowerCommand.includes('run')) return 'run';
    return 'shell';
  }

  // Validate documentation structure
  validateDocumentation(parsed) {
    const issues = [];
    
    if (!parsed.title || parsed.title === 'Untitled Document') {
      issues.push('Document missing title');
    }
    
    if (parsed.sections.length === 0) {
      issues.push('Document has no sections');
    }
    
    if (parsed.steps.length === 0) {
      issues.push('Document has no numbered steps');
    }
    
    // Check for required sections in FlowSource docs
    const requiredSections = ['overview', 'setup', 'configuration'];
    const sectionTitles = parsed.sections.map(s => s.title.toLowerCase());
    
    for (const required of requiredSections) {
      if (!sectionTitles.some(title => title.includes(required))) {
        issues.push(`Missing required section: ${required}`);
      }
    }
    
    if (issues.length > 0) {
      this.logger.warn(`📋 Documentation validation issues: ${issues.join(', ')}`);
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Convert section content tokens to readable text
   * @param {Array|string} content - Array of tokens or string content
   * @returns {string} - Readable text content
   */
  contentToText(content) {
    if (typeof content === 'string') {
      return content;
    }
    
    if (Array.isArray(content)) {
      return content
        .map(token => {
          if (token.content) return token.content;
          if (token.children) return token.children.map(child => child.content || '').join('');
          return '';
        })
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    return '';
  }
}
