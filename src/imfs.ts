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
}
