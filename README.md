# imfs

A toy in-memory filesystem written in Typescript

## Documentation

Interactive documentation can be found in the `docs` directory.

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
