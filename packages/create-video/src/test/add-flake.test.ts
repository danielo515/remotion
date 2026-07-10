import {expect, test} from 'bun:test';
import {existsSync, readFileSync} from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {addFlake} from '../add-flake';

const makeTmpDir = () =>
	fs.mkdtemp(path.join(os.tmpdir(), 'create-video-flake-'));

test('writes flake.nix and .envrc into the project', async () => {
	const dir = await makeTmpDir();
	try {
		addFlake(dir);

		expect(existsSync(path.join(dir, 'flake.nix'))).toBe(true);
		expect(existsSync(path.join(dir, '.envrc'))).toBe(true);

		const flake = readFileSync(path.join(dir, 'flake.nix'), 'utf-8');
		expect(flake).toContain('nodejs_22');
		expect(flake).toContain('corepack');

		const envrc = readFileSync(path.join(dir, '.envrc'), 'utf-8');
		expect(envrc).toContain('use flake');
	} finally {
		await fs.rm(dir, {recursive: true, force: true});
	}
});

test('creates a .gitignore with the direnv entry when none exists', async () => {
	const dir = await makeTmpDir();
	try {
		addFlake(dir);

		const gitignore = readFileSync(path.join(dir, '.gitignore'), 'utf-8');
		expect(gitignore).toContain('.direnv/');
	} finally {
		await fs.rm(dir, {recursive: true, force: true});
	}
});

test('appends the direnv entry to an existing .gitignore', async () => {
	const dir = await makeTmpDir();
	try {
		await fs.writeFile(path.join(dir, '.gitignore'), 'node_modules\nout\n');
		addFlake(dir);

		const gitignore = readFileSync(path.join(dir, '.gitignore'), 'utf-8');
		expect(gitignore).toContain('node_modules');
		expect(gitignore).toContain('.direnv/');
	} finally {
		await fs.rm(dir, {recursive: true, force: true});
	}
});

test('does not duplicate the direnv entry when run twice', async () => {
	const dir = await makeTmpDir();
	try {
		addFlake(dir);
		addFlake(dir);

		const gitignore = readFileSync(path.join(dir, '.gitignore'), 'utf-8');
		const occurrences = gitignore.split('.direnv/').length - 1;
		expect(occurrences).toBe(1);
	} finally {
		await fs.rm(dir, {recursive: true, force: true});
	}
});
