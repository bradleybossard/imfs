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

const invalidCharacters = (character: string) => {
  return `Proposed name contains invalid character: ${character}.`;
};

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
   * Returns an object representing the current directory.
   * @internal
   */
  protected getCurrentDirectory = (): Object => {
    let result = this.fs;
    this.currentPath.forEach(entry => {
      if (result !== {}) {
        if (!(entry in result)) {
          // This should hopefully never happen
          throw new Error(ERROR_INTERNAL_PWD_CORRUPTED);
        }
        result = result[entry];
      }
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
   *
   * Example:
   * ```typescript
   * import imfs from './imfs';
   * const fs = new imfs();
   * console.log(fs.ls());  // '[]'
   * fs.mkdir('foo');
   * console.log(fs.ls());  // '['foo']'
   * fs.touch('bar');
   * console.log(fs.ls());  // '['foo', 'bar']'
   * ```
   */
  ls = (): string[] => {
    const node = this.getCurrentDirectory();
    return Object.keys(node);
  };

  /**
   * Create a new directory in present working directory.  Will
   * throw an error if a directory or file does not exist, or
   * the proposed name does not meet the naming conventions.
   * @param name The name of the directory to be created
   *
   * Example:
   * ```typescript
   * import imfs from './imfs';
   * const fs = new imfs();
   * fs.mkdir('foo');
   * console.log(fs.ls());  // '['foo']'
   * fs.mkdir('foo');  // Throws an exception
   * fs.mkdir('');  // Throws an exception
   * fs.mkdir('*');  // Throws an exception
   * fs.mkdir('x'.repeat(1000));  // Throws an exception
   * ```
   */
  mkdir = (name: string): void => {
    this.validateName(name);
    const node = this.getCurrentDirectory();
    this.validateCreation(node, name);
    node[name] = {};
  };

  /**
   * Change the present working directory.  The directory
   * can be changed to either a child sub directory, or
   * the parent directory.  Will throw an error if changing
   * to the parent while already at root.
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
   * ```
   */
  cd = (directory: string): void => {
    if (directory === '..') {
      if (this.currentPath.length === 0) {
        throw new Error(ERROR_PWD_ROOT);
      }
      this.currentPath.pop();
    } else {
      const node = this.getCurrentDirectory();
      this.validateExistance(node, directory);
      this.validateTypeDirectory(node, directory);
      this.currentPath.push(directory);
    }
  };

  /**
   * Creates an empty file.  Throws an exception if the file or
   * directory name already exists, or the proposed name does not
   * meet the naming conventions.
   * @param filename The name of the file to create
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
   * ```
   */
  touch = (filename: string): void => {
    this.validateName(filename);
    const node = this.getCurrentDirectory();
    this.validateCreation(node, filename);
    node[filename] = '';
  };

  /**
   * Read the contents of a file.  Throws an exception if
   * the file does not exist.
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
   * ```
   */
  read = (filename: string): string => {
    const node = this.getCurrentDirectory();
    this.validateExistance(node, filename);
    this.validateTypeFile(node, filename);
    return node[filename];
  };
}
