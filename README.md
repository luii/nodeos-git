# nodeos-git

> The git client used by NodeOS.

## Prerequisites

It may or may not be needed to build `libgit2`, this dependes on **nodegit**!

If they're providing a prebuild version of `libgit2` for your **Node.js** version
then `prebuild` will download the prebuild version of `libgit2`.

This cuts the installation down to a short time.

## Installation

**Note: Global installation is preffered!**

#### Globally
```sh
$ npm i -g nodeos-git
```

#### Locally
```sh
$ npm i -S nodeos-git
```

## Usage
```js
const git = require('nodeos-git')

// Add files to git
git.add([ files, ... ], { options })
   .catch(err => console.log.bind(console))
   .done(files => {
     console.log(`Added: ${files} to staging`)
   })

// checkout a branch
git.checkout(branch, options)
   .catch(err => console.log.bind(console))
   .done(branch => {
     console.log(`Checkout ${branch}`)
   })

// clone a remote repository
git.clone(remote_repo, dir, options)
   .catch(err => console.log.bind(console))
   .done(repo => {
     console.log(`Cloned repository to ${directory}`)
   })

// ...
```

## Tests

```bash
$ npm test
```

## API Documentation

### Coming soon