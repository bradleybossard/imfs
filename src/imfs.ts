const MAX_NAME_LENGTH = 256;
const INVALID_CHARACTERS = [
  ' ',
  '/',
  '\\',
  '#',
  '@',
  '<',
  '>',
  '{',
  '}',
  '$',
  '?',
  '+',
  '`',
  '|',
  '=',
  '%',
  '*',
  ':',
];

const ERROR_INTERNAL_PWD_CORRUPTED =
  'Internal Error: Present Working Directory corrupted';
const ERROR_NAME_TOO_SHORT =
  'Proposed name too short, must be at least one character';
const ERROR_NAME_TOO_LONG = `Proposed name too long. Must be 1-${MAX_NAME_LENGTH} characters.`;
const ERROR_NAME_ALREADY_EXISTS = 'Proposed name already exists';
const ERROR_NAME_DOES_NOT_EXIST = 'Proposed name does not exist';
const ERROR_PWD_ROOT = 'Current directory is root, cannot change to parent';
const ERROR_NON_DIRECTORY_TYPE =
  'Can not perform operation on non-directory type.';
const ERROR_NON_FILE_TYPE = 'Can not perform operation on non-file type.';
const ERROR_ABSOLUTE_PATH_INVALID_CHARACTERS =
  'Absolute path contains invalid characters';
const ERROR_ABSOLUTE_PATH_DOES_NOT_EXIST =
  'Absolute path contains non-existant sub-directories';

const invalidCharacters = (character: string) => {
  return `Proposed name contains invalid character: ${character}.`;
};

/**
 * A class representing an in-memory filesystem.
 *
 * Limitations of the filesystem include the following:
 * * File and directory names are limited to 256 characters  in length in length
 * * File and directory names should avoid spaces/brackets/typical BASH operators for clarity
 */
export default class Imfs {
  /**
   * Root of nested objects representing the filesystem.
   * @internal
   */
  protected fs = {};

  /**
   * Stack representing the object keys to traverse to the current directory.
   * @internal
   */
  protected currentPath: string[] = [];

  /**
   * Validates that a path can be traversed, and if so, returns a
   * corresponding stack of sub-directories that make up the path.
   * @internal
   * @param path The target path
   * @returns An array of subdirectories if the path can be validated
   */
  protected getAbsolutePath = (path): string[] => {
    const directories = path
      .trim()
      .split('/')
      .filter(token => token !== '');
    let result = this.fs;
    directories.forEach(directory => {
      INVALID_CHARACTERS.forEach(character => {
        if (directory.includes(character)) {
          throw new Error(ERROR_ABSOLUTE_PATH_INVALID_CHARACTERS);
        }
      });

      if (!(directory in result)) {
        throw new Error(ERROR_ABSOLUTE_PATH_DOES_NOT_EXIST);
      }
      result = result[directory];
    });
    return directories;
  };

  /**
   * Returns the directory subpath of an absolute file path
   * @internal
   * @param filepath The absolute path to a file
   * @returns An absolute path to the directory containing the file
   */
  protected getDirectorySubPathFromPath(filepath: string) {
    const directories = filepath.trim().split('/');
    directories.pop();
    return `/${directories.join('/')}/`;
  }

  /**
   * Returns the filename of an absolute file path
   * @internal
   * @param filepath The absolute path to a file
   * @returns The filename contained in the filepath
   */
  protected getFilenameFromPath(filepath: string) {
    const directories = filepath.trim().split('/');
    const filename = directories.pop();
    return filename !== undefined ? filename : '';
  }

  /**
   * Returns an object representing the current directory.
   * @internal
   */
  protected getDirectory = (path: string = ''): Object => {
    let targetPath = this.currentPath;
    if (path.startsWith('/')) {
      const absolutePath = this.getAbsolutePath(path);
      targetPath = absolutePath;
    }
    let result = this.fs;
    targetPath.forEach(entry => {
      if (!(entry in result)) {
        // This should hopefully never happen
        throw new Error(ERROR_INTERNAL_PWD_CORRUPTED);
      }
      result = result[entry];
    });
    return result;
  };

  /**
   * Validates a proposed file/directory name conforms to rules
   * around allowed characters and name length.
   * @internal
   */
  protected validateName = (name: string): void => {
    if (name === '') {
      throw new Error(ERROR_NAME_TOO_SHORT);
    }
    INVALID_CHARACTERS.forEach(character => {
      if (name.includes(character)) {
        throw new Error(invalidCharacters(character));
      }
    });
    if (name.length > MAX_NAME_LENGTH) {
      throw new Error(ERROR_NAME_TOO_LONG);
    }
  };

  /**
   * Validates that a new file or directory does not exist on a given node.
   * @internal
   */
  protected validateCreation = (node: Object, name: string): void => {
    if (name in node) {
      throw new Error(ERROR_NAME_ALREADY_EXISTS);
    }
  };

  /**
   * Validates that a new file or directory exists on a given node.
   * @internal
   */
  protected validateExistance = (node: Object, name: string): void => {
    if (!(name in node)) {
      throw new Error(ERROR_NAME_DOES_NOT_EXIST);
    }
  };

  /**
   * Validates that a name in a directory is of type directory.
   * @internal
   */
  protected validateTypeDirectory = (node: Object, name: string): void => {
    if (typeof node[name] !== 'object' || node[name] === null) {
      throw new Error(ERROR_NON_DIRECTORY_TYPE);
    }
  };

  /**
   * Validates that a name in a directory is of type file.
   * @internal
   */
  protected validateTypeFile = (node: Object, name: string): void => {
    if (typeof node[name] !== 'string') {
      throw new Error(ERROR_NON_FILE_TYPE);
    }
  };

  /**
   * Returns the present working directory.
   *
   * Example:
   * ```typescript
   * import imfs from './imfs';
   * const fs = new imfs();
   * console.log(fs.pwd());  // '/'
   * fs.mkdir('foo');
   * fs.cd('foo');
   * console.log(fs.pwd());  // '/foo'
   * ```
   */
  pwd = (): string => {
    return `/${this.currentPath.join('/')}`;
  };

  /**
   * List directory contents.
   * @param path Optional parameter to show contents for an absolute path
   *
   * Example:
   * ```typescript
   * import imfs from './imfs';
   * const fs = new imfs();
   * console.log(fs.ls());  // []
   * fs.mkdir('foo');
   * console.log(fs.ls());  // ['foo']
   * fs.touch('bar');
   * console.log(fs.ls());  // ['foo', 'bar']
   * fs.cd('foo');
   * console.log(fs.ls());  // []
   * console.log(fs.ls('/'));  // ['foo', 'bar']
   * ```
   */
  ls = (path: string = ''): string[] => {
    const node = this.getDirectory(path);
    return Object.keys(node);
  };

  /**
   * Creates a new directory.  Will use present working directory if path
   * is not provided.  Throws an error if a directory or file does not
   * exist, or the proposed name does not meet the naming conventions.
   * @param name The name of the directory to be created
   * @param path Optional absolute path parameter to create directory in
   *
   * Example:
   * ```typescript
   * import imfs from './imfs';
   * const fs = new imfs();
   * fs.mkdir('foo');
   * console.log(fs.ls());  // ['foo']
   * fs.mkdir('foo');  // Throws an exception
   * fs.mkdir('');  // Throws an exception
   * fs.mkdir('*');  // Throws an exception
   * fs.mkdir('x'.repeat(1000));  // Throws an exception
   * fs.cd('foo');
   * fs.mkdir('bar', '/');
   * console.log(fs.ls('/'));  // ['foo', 'bar']
   * ```
   */
  mkdir = (name: string, path: string = ''): void => {
    this.validateName(name);
    const node = this.getDirectory(path);
    this.validateCreation(node, name);
    node[name] = {};
  };

  /**
   * Change the present working directory.  The directory
   * can be changed to either a child sub directory,
   * an absolute directory, or the parent directory.
   * Throws an error if changing to the parent while
   * already at root.
   * @param directory The directory to be changed to
   *
   * Example:
   * ```typescript
   * import imfs from './imfs';
   * const fs = new imfs();
   * fs.mkdir('foo');
   * fs.cd('foo');
   * console.log(fs.pwd());  // '/foo'
   * fs.cd('..');
   * console.log(fs.pwd());  // '/'
   * fs.cd('..');  // Throws an exception
   * fs.mkdir('bar');
   * fs.cd('foo');
   * fs.cd('/bar');
   * console.log(fs.pwd());  // '/bar'
   * ```
   */
  cd = (directory: string): void => {
    if (directory === '..') {
      if (this.currentPath.length === 0) {
        throw new Error(ERROR_PWD_ROOT);
      }
      this.currentPath.pop();
    } else if (directory.startsWith('/')) {
      this.currentPath = this.getAbsolutePath(directory);
    } else {
      const node = this.getDirectory();
      this.validateExistance(node, directory);
      this.validateTypeDirectory(node, directory);
      this.currentPath.push(directory);
    }
  };

  /**
   * Creates an empty file in the present working directory, unless
   * an absolute path is provided, in which case, it is created there.
   * Throws an exception if the file or directory name already exists,
   * or the proposed name does not meet the naming conventions.
   * @param filename The name of the file to create
   * @param path Optional absolute path to directory to create file in
   *
   * Example:
   * ```typescript
   * import imfs from './imfs';
   * const fs = new imfs();
   * fs.touch('foo');
   * console.log(fs.ls());  // ['foo']
   * fs.touch('foo');  // Throws an exception
   * fs.touch('');  // Throws an exception
   * fs.touch('*');  // Throws an exception
   * fs.touch('x'.repeat(1000));  // Throws an exception
   * fs.mkdir('bar');
   * fs.cd('bar');
   * fs.touch('goo', '/');
   * console.log(fs.ls('/'));  // ['foo', 'goo']
   * ```
   */
  touch = (filename: string, path: string = ''): void => {
    this.validateName(filename);
    const node = this.getDirectory(path);
    this.validateCreation(node, filename);
    node[filename] = '';
  };

  /**
   * Read the contents of a file in the present working directory, unless
   * an absolute path is provided, in which case, it is read from there.
   * Throws an exception if the file does not exist.
   * @param filename The name of the file to be read
   * @returns A string containing the contents of the file.
   *
   * Example:
   * ```typescript
   * import imfs from './imfs';
   * const fs = new imfs();
   * fs.touch('foo');
   * console.log(fs.read('foo'));  // ''
   * fs.write('foo', 'bar');
   * console.log(fs.read('foo'));  // 'bar'
   * fs.read('goo');  // Throws an exception
   * fs.mkdir('bah');
   * fs.cd('bah');
   * fs.touch('baz');
   * fs.cd('/');
   * console.log(fs.read('/bah/baz'));  // ''
   * ```
   */
  read = (filename: string): string => {
    const isAbsolute = filename.startsWith('/');
    const path = isAbsolute ? this.getDirectorySubPathFromPath(filename) : '';
    filename = isAbsolute ? this.getFilenameFromPath(filename) : filename;
    const node = this.getDirectory(path);
    this.validateExistance(node, filename);
    this.validateTypeFile(node, filename);
    return node[filename];
  };

  /**
   * Writes a string to a file in the present working directory, unless
   * an absolute path is provided, in which case, it is written there
   * Throws an exception if the file does not exist.
   * @param filename The name of the file to write to
   * @param contents The contents to be written to the file
   *
   * Example:
   * ```typescript
   * import imfs from './imfs';
   * const fs = new imfs();
   * fs.touch('foo');
   * fs.write('foo', 'bar');
   * console.log(fs.read('foo'));  // 'bar'
   * fs.write('goo');  // Throws an exception
   * fs.mkdir('bah');
   * fs.cd('bah');
   * fs.touch('baz');
   * fs.cd('/');
   * fs.write('/bah/baz', 'some text')
   * console.log(fs.read('/bah/baz'));  // 'some text'
   * ```
   */
  write = (filename: string, contents: string): void => {
    const isAbsolute = filename.startsWith('/');
    const path = isAbsolute ? this.getDirectorySubPathFromPath(filename) : '';
    filename = isAbsolute ? this.getFilenameFromPath(filename) : filename;
    const node = this.getDirectory(path);
    this.validateExistance(node, filename);
    node[filename] = contents;
  };

  /**
   * Remove a directory.  Throws an exception if the directory
   * does not exist.
   * @param name The name of the directory to be removed
   *
   * Example:
   * ```typescript
   * import imfs from './imfs';
   * const fs = new imfs();
   * fs.mkdir('foo');
   * console.log(fs.ls());  // ['foo']
   * fs.rmdir('foo');
   * console.log(fs.ls());  // []
   * fs.rmdir('foo');  // Throws an exception
   * ```
   */
  rmdir = (name: string): void => {
    const node = this.getDirectory();
    this.validateExistance(node, name);
    delete node[name];
  };

  /**
   * Searches the present working directory for a given name.
   * @param name The name to be searched for
   * @returns
   *
   * Example:
   * ```typescript
   * import imfs from './imfs';
   * const fs = new imfs();
   * fs.mkdir('foo');
   * fs.touch('bar');
   * console.log(fs.find('foo'));  // ['foo']
   * console.log(fs.find('bar'));  // ['bar']
   * console.log(fs.find('goo'));  // ['']
   * ```
   */
  find = (name: string): string[] => {
    const node = this.getDirectory();
    return Object.keys(node).filter(key => key === name);
  };

  /**
   * Resets an entire filesystem.
   *
   * Example:
   * ```typescript
   * import imfs from './imfs';
   * const fs = new imfs();
   * fs.mkdir('foo');
   * console.log(fs.ls());   // ['foo']
   * fs.cd('foo');
   * console.log(fs.pwd());  // '/foo'
   * fs.cls();
   * console.log(fs.ls());   // []
   * console.log(fs.pwd());  // '/'
   * ```
   */
  cls = (): void => {
    this.fs = {};
    this.currentPath = [];
  };
}
