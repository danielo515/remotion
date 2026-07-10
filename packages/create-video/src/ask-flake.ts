import prompts from './prompts';

export const askFlake = async () => {
	const {answer} = await prompts({
		type: 'toggle',
		name: 'answer',
		message:
			'Add a Nix flake (with direnv) for a reproducible dev environment?',
		initial: false,
		active: 'Yes',
		inactive: 'No',
	});

	return answer as boolean;
};
