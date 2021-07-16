import imfs from './imfs';

const longString = 'x'.repeat(1000);

describe('pwd', () => {
  test('get current working directory', () => {
    const fs = new imfs();
    expect(fs.pwd()).toEqual('/');
  });
});

describe('ls', () => {
  test('returns empty listing', () => {
    const fs = new imfs();
    expect(fs.ls()).toEqual([]);
  });
});

describe('mkdir', () => {
  test('make a directory', () => {
    const fs = new imfs();
    fs.mkdir('test');
    expect(fs.ls()).toEqual(['test']);
  });

  test('throws error when already exists', () => {
    const fs = new imfs();
    fs.mkdir('test');
    expect(() => fs.mkdir('test')).toThrow(/name already exists/);
  });

  test('throws error when name is too short', () => {
    const fs = new imfs();
    expect(() => fs.mkdir('')).toThrow(/name too short/);
  });

  test('throws error when name is too long', () => {
    const fs = new imfs();
    expect(() => fs.mkdir(longString)).toThrow(/name too long/);
  });

  test('throws error when name contains invalid characters', () => {
    const fs = new imfs();
    expect(() => fs.mkdir('*')).toThrow(/invalid character/);
  });
});
