# Generate Vue CLI

[![License](https://img.shields.io/npm/l/express.svg)](https://github.com/arminbro/generate-vue-cli/blob/master/LICENSE)

## Why?

I love using [generate-react-cli](https://github.com/arminbro/generate-react-cli) and really missed it when tinkering with Vue, so decided to adapt it for Vue help speed up productivity in Vue projects and stop copying, pasting, and renaming files each time I want to create a new component.

This is a stripped-back MVP and does not have all the options equivalent to  generate-react-cli. It assumes you are using TypeScript, Vue Testing Library, and component-scoped SCSS for styling.

## Table of Contents:

- [Config file](#config-file)
- [Generate components](#generate-components)
- [Custom component types](#custom-component-types)
- [Custom component templates](#custom-component-templates)
- [Custom additional files](#custom-additional-files)

## Quick start

```
  npx generate-vue-cli component Box
```

_([npx](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b) is a package runner tool that comes with npm 5.2+)_

## Config File

When you run GVC within your project the first time, it will ask you a series of questions to customize the cli for your project needs (this will create a "generate-vue-cli.json" config file). Below is an example:

```json
{
  "component": {
    "default": {
      "path": "src/components",
      "withStory": false,
      "withTest": true
    }
  }
}
```

## Generate Components

```sh
  npx generate-vue-cli component Box
```

This command will create a folder with your component name within your default (e.g. **src/components**) directory, and its corresponding files.

#### Example of the component files structure:

```
|-- /src
    |-- /components
        |-- /Box
            |-- Box.vue
            |-- Box.test.tsx
            |-- Box.stories.tsx
```

### Custom component types

By default, GVC will use the `component.default` configuration rules when running the component command out of the box.

What if you wanted to generate other types of components that have their own set of config rules (e.g., **page** or **layout**)?

You can do so by extending the **generate-vue-cli.json** config file like this.

```json
{
	"component": {
		"default": {
			"path": "src/components",
			"withStory": false,
			"withStyle": true,
			"withTest": true
		},
		"page": {
			"path": "src/pages",
			"withStory": false,
			"withStyle": true,
			"withTest": true
		},
		"layout": {
			"path": "src/layout",
			"withStory": false,
			"withStyle": false,
			"withTest": true
		}
	}
}
```

Now you can generate a component with your custom component types like this:

```sh
  npx generate-vue-cli component HomePage --type=page
```

```sh
  npx generate-vue-cli component BoxLayout --type=layout
```

### Custom component templates

You can also create your own custom templates that GVC can use instead of the built-in templates that come with it. We hope this will provide more flexibility for your components that you want to generate.

There is an optional `customTemplates` object that you can pass to the `component.default` or any of your custom component types within your **generate-vue-cli.json** config file.

#### Example of the `customTemplates` object:

```json
"customTemplates": {
  "component": "templates/TemplateName.vue",
  "story":  "templates/TemplateName.stories.tsx",
  "test":  "templates/TemplateName.test.tsx"
},
```

The keys represent the type of file, and the values are the paths that point to where your custom template lives in your project/system. Please note the `TemplateName` keyword in the template filename. GVC will use this keyword and replace it with your component name (in whichever format you typed the component name in the command) as the filename.

#### Example of using the `customTemplates` object within your generate-vue-cli.json config file:

```json
{
	"component": {
		"default": {
			"customTemplates": {
				"component": "templates/component/TemplateName.vue",
				"test": "templates/component/TemplateName.test.js"
			},
			"path": "src/components",
			"withTest": true,
			"withStory": true
		},
		"page": {
			"customTemplates": {
				"component": "templates/page/TemplateName.vue"
			},
			"path": "src/pages",
			"withStory": false,
			"withTest": true
		}
	}
}
```

- `npx generate-vue-cli component MyComponent` will use the `default` files and place the results in the `src/components` directory.
- `npx generate-vue-cli component MyComponent --type=page` will use the `page` files and place the results in the `src/pages` directory.

Notice in the `page.customTemplates` that we only specified the `component` custom template type. That's because all the custom template types are optional. If you don't set the other types, GVC will default to using the built-in templates it comes with.

## Custom additional files

What if you wanted to add other file types?

You can do so using the `withThing` property and corresponding `customTemplates.thing` pattern. For example, I wanted to add a `block.json` file and a PHP template partial for a WordPress theme. I did it like so: 

```json
{
	"component": {
		"default": {
			"path": "blocks/custom",
			"withStyle": false,
			"withJson": true,
			"withPhp": true,
			"customTemplates": {
				"component": "blocks/_block-generator-templates/TemplateName.vue",
				"json": "blocks/_block-generator-templates/block.json",
				"php": "blocks/_block-generator-templates/index.php"
			},
			"withTest": false,
			"withStory": false
		}
	}
}
```

WordPress is expecting `block.json` (not `template-name.json`), that's why it's named like that; but the `template-name` replacement conventions should still work for custom files. 

## License

Generate Vue CLI is an open source software [licensed as MIT](https://github.com/doubleedesign/generate-vue-cli/blob/master/LICENSE).
