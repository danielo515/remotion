import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {Log} from './log';

const flakeNix = `{
  description = "Remotion video project development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = {
    nixpkgs,
    flake-utils,
    ...
  }:
    flake-utils.lib.eachDefaultSystem (
      system: let
        pkgs = import nixpkgs {inherit system;};

        # Shared libraries the Chrome Headless Shell that Remotion downloads
        # for rendering links against at runtime. Without them the browser
        # cannot start on NixOS and other Nix-managed systems.
        chromeLibs = with pkgs; [
          alsa-lib
          at-spi2-atk
          at-spi2-core
          atk
          cairo
          cups
          dbus
          expat
          fontconfig
          freetype
          gdk-pixbuf
          glib
          gtk3
          libdrm
          libxkbcommon
          mesa
          nspr
          nss
          pango
          xorg.libX11
          xorg.libXcomposite
          xorg.libXdamage
          xorg.libXext
          xorg.libXfixes
          xorg.libXrandr
          xorg.libxcb
          zlib
        ];
      in {
        devShells.default = pkgs.mkShell {
          packages =
            [
              # Node.js LTS, matching the version Remotion is developed against.
              pkgs.nodejs_22
              # Corepack manages the project's package manager (npm/pnpm/yarn).
              pkgs.corepack
            ]
            ++ chromeLibs;

          # The Chrome Headless Shell is dynamically linked, so point the loader
          # at the libraries declared above.
          LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath chromeLibs;

          shellHook = ''
            export PATH="$PWD/node_modules/.bin:$PATH"
            echo "Remotion dev shell ready (Node $(node --version))."
          '';
        };
      }
    );
}
`;

const envrc = `use flake
`;

const gitignoreSection = `
# direnv
.direnv/
`;

const updateGitignore = (projectRoot: string) => {
	const gitignorePath = path.join(projectRoot, '.gitignore');

	if (!existsSync(gitignorePath)) {
		writeFileSync(gitignorePath, gitignoreSection.trimStart());
		return;
	}

	const existing = readFileSync(gitignorePath, 'utf-8');
	if (existing.includes('.direnv')) {
		return;
	}

	const separator = existing.endsWith('\n') ? '' : '\n';
	writeFileSync(gitignorePath, existing + separator + gitignoreSection);
};

export const addFlake = (projectRoot: string) => {
	Log.info('Adding flake.nix and direnv configuration.');

	writeFileSync(path.join(projectRoot, 'flake.nix'), flakeNix);
	writeFileSync(path.join(projectRoot, '.envrc'), envrc);
	updateGitignore(projectRoot);
};
