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
}
