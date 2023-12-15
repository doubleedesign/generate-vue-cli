import chalk from 'chalk';
import path from 'path';
import replace from 'replace';
import camelCase from 'lodash/camelCase.js';
import kebabCase from 'lodash/kebabCase.js';
import snakeCase from 'lodash/snakeCase.js';
import startCase from 'lodash/startCase.js';
import fsExtra from 'fs-extra';
const { existsSync, outputFileSync, readFileSync } = fsExtra;
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const componentTemplate = readFileSync(path.resolve(__dirname, '../templates/component/componentTemplate.vue'));
const componentStoryTemplate = readFileSync(path.resolve(__dirname, '../templates/component/componentStoryTemplate.js'));
const componentTestTemplate = readFileSync(path.resolve(__dirname, '../templates/component/componentTestTemplate.js'));

const templateNameRE = /.*(template[|_-]?name).*/i;

export function getComponentByType(args, cliConfigFile) {
	const hasComponentTypeOption = args.find((arg) => arg.includes('--type'));

	// Check for component type option.

	if (hasComponentTypeOption) {
		const componentType = hasComponentTypeOption.split('=')[1]; // get the component type value
		const selectedComponentType = cliConfigFile.component[componentType];

		// If the selected component type does not exist in the cliConfigFile under `component` throw an error
		if (!selectedComponentType) {
			console.error(
				chalk.red(
					`
  ERROR: Please make sure the component type you're trying to use exists in the
  ${chalk.bold('generate-vue-cli.json')} config file under the ${chalk.bold('component')} object.
              `,
				),
			);

			process.exit(1);
		}

		// Otherwise return it.
		return selectedComponentType;
	}

	// Otherwise return the default component type.
	return cliConfigFile.component.default;
}

export function getCorrespondingComponentFileTypes(component) {
	return Object.keys(component).filter((key) => key.split('with').length > 1);
}

function getCustomTemplate(componentName, templatePath) {
	// --- Try loading custom template

	try {
		const template = readFileSync(templatePath, 'utf8');
		const filename = path.basename(templatePath).replace('TemplateName', componentName);

		return { template, filename };
	}
	catch (e) {
		console.error(
			chalk.red(
				`
ERROR: The custom template path of "${templatePath}" does not exist.
Please make sure you're pointing to the right custom template path in your generate-vue-cli.json config file.
        `,
			),
		);

		return process.exit(1);
	}
}

function componentDirectoryNameGenerator({ cmd, componentName, cliConfigFile, filename, converters }) {
	let componentPath = cmd.path;

	if (cmd.flat !== true) {
		let componentDirectory = componentName;

		const customDirectoryConfigs = [
			cliConfigFile.customDirectory,
			cliConfigFile.component.default.customDirectory,
			cliConfigFile.component[cmd.type].customDirectory,
			cmd.customDirectory,
		].filter((e) => Boolean(e) && typeof e === 'string');

		if (customDirectoryConfigs.length > 0) {
			const customDirectory = customDirectoryConfigs.slice(-1).toString();

			// Double check if the customDirectory is templatable
			if (templateNameRE.exec(customDirectory) == null) {
				console.error(
					chalk.red(
						`customDirectory [${customDirectory}] for ${componentName} does not contain a templatable value.\nPlease check your configuration!`,
					),
				);

				process.exit(-2);
			}

			for (const converter in converters) {
				const re = new RegExp(`.*${converter}.*`);

				if (re.exec(customDirectory) !== null) {
					componentDirectory = customDirectory.replace(converter, converters[converter]);
				}
			}
		}

		componentPath += `/${componentDirectory}`;
	}

	componentPath += `/${filename}`;

	return componentPath;
}

function componentTemplateGenerator({ cmd, componentName, cliConfigFile, converters }) {
	const { customTemplates } = cliConfigFile.component[cmd.type];

	// Default templates
	let template = componentTemplate;
	let filename = `${componentName}.vue`;

	// Check for a custom component template and use it if one exists
	if (customTemplates && customTemplates.component) {
		const { template: customTemplate, filename: customTemplateFilename } = getCustomTemplate(
			componentName,
			customTemplates.component,
		);

		template = customTemplate;
		filename = customTemplateFilename;
	}

	return {
		componentPath: componentDirectoryNameGenerator({ cmd, componentName, cliConfigFile, filename, converters }),
		filename,
		template,
	};
}

function componentTestTemplateGenerator({ cliConfigFile, cmd, componentName, converters }) {
	const { customTemplates } = cliConfigFile.component[cmd.type];
	let template = componentTestTemplate;
	let filename = `${componentName}.test.tsx`;

	// Check for a custom test template and use it if available
	if (customTemplates && customTemplates.test) {
		const { template: customTemplate, filename: customTemplateFilename } = getCustomTemplate(
			componentName,
			customTemplates.test,
		);

		template = customTemplate;
		filename = customTemplateFilename;
	}

	return {
		componentPath: componentDirectoryNameGenerator({ cmd, componentName, cliConfigFile, filename, converters }),
		filename,
		template,
	};
}

function componentStoryTemplateGenerator({ cliConfigFile, cmd, componentName, converters }) {
	const { customTemplates } = cliConfigFile.component[cmd.type];
	let template = componentStoryTemplate;
	let filename = `${componentName}.stories.tsx`;

	// Check for a custom story template.

	if (customTemplates && customTemplates.story) {
		// --- Load and use the custom story template

		const { template: customTemplate, filename: customTemplateFilename } = getCustomTemplate(
			componentName,
			customTemplates.story,
		);

		template = customTemplate;
		filename = customTemplateFilename;
	}
	return {
		componentPath: componentDirectoryNameGenerator({ cmd, componentName, cliConfigFile, filename, converters }),
		filename,
		template,
	};
}

const buildInComponentFileTypes = {
	COMPONENT: 'component',
	TEST: 'withTest',
	STORY: 'withStory'
};

// --- Generate component template map
const componentTemplateGeneratorMap = {
	[buildInComponentFileTypes.COMPONENT]: componentTemplateGenerator,
	[buildInComponentFileTypes.TEST]: componentTestTemplateGenerator,
	[buildInComponentFileTypes.STORY]: componentStoryTemplateGenerator,
};

export function generateComponent(componentName, cmd, cliConfigFile) {
	const componentFileTypes = ['component', ...getCorrespondingComponentFileTypes(cmd)];

	componentFileTypes.forEach((componentFileType) => {
		// --- Generate templates only if the component options (withStyle, withTest, etc..) are true,
		// or if the template type is "component"

		if (
			(cmd[componentFileType] && cmd[componentFileType].toString() === 'true') ||
			componentFileType === buildInComponentFileTypes.COMPONENT
		) {
			const generateTemplate = componentTemplateGeneratorMap[componentFileType];

			const converters = {
				templatename: componentName,
				TemplateName: startCase(camelCase(componentName)).replace(/ /g, ''),
				templateName: camelCase(componentName),
				'template-name': kebabCase(componentName),
				template_name: snakeCase(componentName),
				TEMPLATE_NAME: snakeCase(componentName).toUpperCase(),
			};

			const { componentPath, filename, template } = generateTemplate({
				cmd,
				componentName,
				cliConfigFile,
				componentFileType,
				converters,
			});

			// --- Make sure the component does not already exist in the path directory.
			if (existsSync(componentPath)) {
				console.error(chalk.red(`${filename} already exists in this path "${componentPath}".`));
			}
			else {
				try {
					if (!cmd.dryRun) {
						outputFileSync(componentPath, template);

						// Will replace the templatename in whichever format the user typed the component name in the command.
						replace({
							regex: 'templatename',
							replacement: converters['templatename'],
							paths: [componentPath],
							recursive: false,
							silent: true,
						});

						// Will replace the TemplateName in PascalCase
						replace({
							regex: 'TemplateName',
							replacement: converters['TemplateName'],
							paths: [componentPath],
							recursive: false,
							silent: true,
						});

						// Will replace the templateName in camelCase
						replace({
							regex: 'templateName',
							replacement: converters['templateName'],
							paths: [componentPath],
							recursive: false,
							silent: true,
						});

						// Will replace the template-name in kebab-case
						replace({
							regex: 'template-name',
							replacement: converters['template-name'],
							paths: [componentPath],
							recursive: false,
							silent: true,
						});

						// Will replace the template_name in snake_case
						replace({
							regex: 'template_name',
							replacement: converters['template_name'],
							paths: [componentPath],
							recursive: false,
							silent: true,
						});

						// Will replace the TEMPLATE_NAME in uppercase SNAKE_CASE
						replace({
							regex: 'TEMPLATE_NAME',
							replacement: converters['TEMPLATE_NAME'],
							paths: [componentPath],
							recursive: false,
							silent: true,
						});
					}

					console.log(chalk.green(`${filename} was successfully created at ${componentPath}`));
				}
				catch (error) {
					console.error(chalk.red(`${filename} failed and was not created.`));
					console.error(error);
				}
			}
		}
	});

	if (cmd.dryRun) {
		console.log();
		console.log(chalk.yellow('NOTE: The "dry-run" flag means no changes were made.'));
	}
}
