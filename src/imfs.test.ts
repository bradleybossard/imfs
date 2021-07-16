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

describe('cd', () => {
  test('successfully changes directory', () => {
    const fs = new imfs();
    fs.mkdir('test');
    fs.cd('test');
    expect(fs.pwd()).toEqual('/test');
  });

  test('successfully changes to nested directories', () => {
    const fs = new imfs();
    fs.mkdir('test');
    fs.cd('test');
    fs.mkdir('test2');
    fs.cd('test2');
    expect(fs.pwd()).toEqual('/test/test2');
  });

  test('throws error when changing to parent while root', () => {
    const fs = new imfs();
    expect(() => fs.cd('..')).toThrow(/Current directory is root/);
  });

  test('throws error when changing to non-existance directory', () => {
    const fs = new imfs();
    expect(() => fs.cd('test')).toThrow(/does not exist/);
  });
});

describe('touch', () => {
  test('make a file', () => {
    const fs = new imfs();
    fs.touch('test');
    expect(fs.ls()).toEqual(['test']);
  });

  test('throws error when name already exists', () => {
    const fs = new imfs();
    fs.touch('test');
    expect(() => fs.touch('test')).toThrow(/name already exists/);
  });

  test('throws error when name is too long', () => {
    const fs = new imfs();
    expect(() => fs.touch(longString)).toThrow(/name too long/);
  });
});

describe('read', () => {
  test('read from a file', () => {
    const fs = new imfs();
    fs.touch('test');
    expect(fs.read('test')).toEqual('');
  });

  test('throws error when file does not exist', () => {
    const fs = new imfs();
    expect(() => fs.read('test')).toThrow(/does not exist/);
  });

  test('throws error when file is not type file', () => {
    const fs = new imfs();
    fs.mkdir('test');
    expect(() => fs.read('test')).toThrow(/non-file type/);
  });
});

describe('write', () => {
  test('writes to a file', () => {
    const fs = new imfs();
    fs.touch('test');
    fs.write('test', 'some text');
    expect(fs.read('test')).toEqual('some text');
  });

  test('throws error when file does not exist', () => {
    const fs = new imfs();
    expect(() => fs.write('test', 'some text')).toThrow(/does not exist/);
  });
});

describe('rmdir', () => {
  test('removes a directory', () => {
    const fs = new imfs();
    fs.mkdir('test');
    expect(fs.ls()).toEqual(['test']);
    fs.rmdir('test');
    expect(fs.ls()).toEqual([]);
  });

  test('throws error when directory does not exist', () => {
    const fs = new imfs();
    expect(() => fs.rmdir('test')).toThrow(/does not exist/);
  });
});

describe('find', () => {
  test('finds a file', () => {
    const fs = new imfs();
    fs.touch('test');
    expect(fs.find('test')).toEqual(['test']);
  });

  test('finds a directory', () => {
    const fs = new imfs();
    fs.mkdir('test');
    expect(fs.find('test')).toEqual(['test']);
  });

  test('finds nothing with non-matching search', () => {
    const fs = new imfs();
    fs.mkdir('test1');
    fs.touch('test2');
    expect(fs.find('test3')).toEqual([]);
  });
});

describe('cls', () => {
  test('clears the filesystem', () => {
    const fs = new imfs();
    fs.mkdir('test');
    fs.cd('test');
    expect(fs.pwd()).toEqual('/test');
    fs.cls();
    expect(fs.pwd()).toEqual('/');
    expect(fs.ls()).toEqual([]);
  });
});

describe('absolute paths', () => {
  test('ls', () => {
    const fs = new imfs();
    fs.mkdir('test');
    fs.cd('test');
    fs.mkdir('test2');
    fs.cd('test2');
    expect(fs.ls('/')).toEqual(['test']);
    fs.mkdir('test3');
    fs.cd('test3');
    expect(fs.ls('/test')).toEqual(['test2']);
    expect(fs.ls('/test/')).toEqual(['test2']);
    expect(fs.ls('/test//')).toEqual(['test2']);
    expect(fs.ls('/test/ ')).toEqual(['test2']);
    expect(() => fs.ls('/test2')).toThrow(/contains non-existant/);
  });
});
