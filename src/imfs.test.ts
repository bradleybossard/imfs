import imfs from './imfs';

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
