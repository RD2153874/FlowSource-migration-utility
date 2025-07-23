// File Manager - Handles file operations with error handling and logging
import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import { Logger } from './Logger.js';

export class FileManager {
  constructor() {
    this.logger = Logger.getInstance();
  }

  async ensureDir(dirPath) {
    try {
      await fs.ensureDir(dirPath);
      this.logger.debug(`📁 Directory ensured: ${dirPath}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to ensure directory ${dirPath}: ${error.message}`);
      throw error;
    }
  }

  async copyFile(source, destination, options = {}) {
    try {
      await this.ensureDir(path.dirname(destination));
      await fs.copy(source, destination, { overwrite: true, ...options });
      this.logger.fileCopied(source, destination);
      return true;
    } catch (error) {
      this.logger.error(`Failed to copy file ${source} to ${destination}: ${error.message}`);
      throw error;
    }
  }

  async copyDirectory(source, destination, options = {}) {
    try {
      await this.ensureDir(path.dirname(destination));
      await fs.copy(source, destination, { overwrite: true, ...options });
      this.logger.fileCopied(source, destination);
      return true;
    } catch (error) {
      this.logger.error(`Failed to copy directory ${source} to ${destination}: ${error.message}`);
      throw error;
    }
  }

  async readFile(filePath, encoding = 'utf8') {
    try {
      const content = await fs.readFile(filePath, encoding);
      this.logger.debug(`📖 Read file: ${filePath}`);
      return content;
    } catch (error) {
      this.logger.error(`Failed to read file ${filePath}: ${error.message}`);
      throw error;
    }
  }

  async writeFile(filePath, content, encoding = 'utf8') {
    try {
      await this.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, content, encoding);
      this.logger.fileCreated(filePath);
      return true;
    } catch (error) {
      this.logger.error(`Failed to write file ${filePath}: ${error.message}`);
      throw error;
    }
  }

  async readJson(filePath) {
    try {
      const data = await fs.readJson(filePath);
      this.logger.debug(`📄 Read JSON: ${filePath}`);
      return data;
    } catch (error) {
      this.logger.error(`Failed to read JSON ${filePath}: ${error.message}`);
      throw error;
    }
  }

  async writeJson(filePath, data, options = { spaces: 2 }) {
    try {
      await this.ensureDir(path.dirname(filePath));
      await fs.writeJson(filePath, data, options);
      this.logger.fileCreated(filePath);
      return true;
    } catch (error) {
      this.logger.error(`Failed to write JSON ${filePath}: ${error.message}`);
      throw error;
    }
  }

  async pathExists(filePath) {
    try {
      return await fs.pathExists(filePath);
    } catch (error) {
      this.logger.error(`Failed to check path existence ${filePath}: ${error.message}`);
      return false;
    }
  }

  async deleteFile(filePath) {
    try {
      await fs.remove(filePath);
      this.logger.fileDeleted(filePath);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete file ${filePath}: ${error.message}`);
      throw error;
    }
  }

  async findFiles(pattern, options = {}) {
    try {
      const files = await glob(pattern, {
        absolute: true,
        ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
        ...options
      });
      this.logger.debug(`🔍 Found ${files.length} files matching pattern: ${pattern}`);
      return files;
    } catch (error) {
      this.logger.error(`Failed to find files with pattern ${pattern}: ${error.message}`);
      throw error;
    }
  }

  async getDirectoryContents(dirPath) {
    try {
      const contents = await fs.readdir(dirPath, { withFileTypes: true });
      const result = {
        files: [],
        directories: []
      };

      for (const item of contents) {
        if (item.isFile()) {
          result.files.push(item.name);
        } else if (item.isDirectory()) {
          result.directories.push(item.name);
        }
      }

      this.logger.debug(`📁 Directory contents: ${dirPath} (${result.files.length} files, ${result.directories.length} dirs)`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to read directory contents ${dirPath}: ${error.message}`);
      throw error;
    }
  }

  async copyFiles(fileMapping, options = {}) {
    const results = {
      success: [],
      failed: []
    };

    for (const [source, destination] of Object.entries(fileMapping)) {
      try {
        await this.copyFile(source, destination, options);
        results.success.push({ source, destination });
      } catch (error) {
        results.failed.push({ source, destination, error: error.message });
      }
    }

    this.logger.info(`📋 Batch copy completed: ${results.success.length} success, ${results.failed.length} failed`);
    return results;
  }

  async getFileStats(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
      };
    } catch (error) {
      this.logger.error(`Failed to get file stats ${filePath}: ${error.message}`);
      throw error;
    }
  }

  async createSymlink(target, linkPath) {
    try {
      await this.ensureDir(path.dirname(linkPath));
      await fs.symlink(target, linkPath);
      this.logger.debug(`🔗 Symlink created: ${linkPath} → ${target}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to create symlink ${linkPath} → ${target}: ${error.message}`);
      throw error;
    }
  }

  // Utility method for safe file operations with backup
  async safeFileOperation(operation, filePath, backupPath = null) {
    let backupCreated = false;
    
    try {
      // Create backup if requested and file exists
      if (backupPath && await this.pathExists(filePath)) {
        await this.copyFile(filePath, backupPath);
        backupCreated = true;
        this.logger.debug(`💾 Backup created: ${backupPath}`);
      }

      // Perform the operation
      await operation();
      
      // Remove backup if operation succeeded
      if (backupCreated && await this.pathExists(backupPath)) {
        await this.deleteFile(backupPath);
      }
      
      return true;
    } catch (error) {
      // Restore from backup if operation failed
      if (backupCreated && await this.pathExists(backupPath)) {
        await this.copyFile(backupPath, filePath);
        await this.deleteFile(backupPath);
        this.logger.info(`🔄 Restored from backup: ${filePath}`);
      }
      
      throw error;
    }
  }
}
