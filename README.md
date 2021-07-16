# imfs

A toy in-memory filesystem written in Typescript

## Documentation

Interactive documentation can be found in the `docs` directory or online [here](https://bradleybossard.github.io/imfs/)

## Install

```
git clone https://github.com/bradleybossard/imfs.git
yarn install
yarn run test
```

## Interactive Usage

1.  Install `ts-node`

```
npm install --global ts-node
```

2. Run a `ts-node` REPL

```
ts-node
```

3. Create a filsystem and execute commands against it

```
> import imfs from './src/imfs';
> fs.ls();
[]
> fs.mkdir('test');
undefined
> fs.ls();
[ 'test' ]
> fs.rmdir('test');
undefined
> fs.ls()
[]
```

## Notes for future development

- Implementing a copy function would involve writing a helper
  function that would deeply clone an object at a src path and
  create a new key/value on the target object where key was taken
  from the src object and value is the deeply clone object.

- Implementing move could use the copy function above, then delete
  the previous object.

- To implement some advanced features such as permissions or symlinks,
  the code would have to be heavily reworked such that each node object
  implements a shape in the form of something like

```typscript
{
  type: 'directory' | 'file' | 'symlink' | 'hardlink',
  data: <data of file>,
  owner <owner>,
  permissions: <permissions>
}
```
