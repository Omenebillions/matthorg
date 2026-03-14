# To learn more about how to use Nix to configure your environment
# see: https://developers.google.com/idx/guides/customize-idx-env
{pkgs}: {
  # Which nixpkgs channel to use.
  channel = "stable-24.05"; 

  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.deno
    pkgs.nodejs_20
    pkgs.yarn
    pkgs.nodePackages.pnpm
    pkgs.bun
  ];

  # Sets environment variables in the workspace
  env = {};

  idx = {
    # Search for the extensions you want on https://open-vsx.org/
    extensions = [
      "denoland.vscode-deno"
      "google.gemini-cli-vscode-ide-companion"
    ];

    workspace = {
      # Runs when a workspace is first created
      onCreate = {
        npm-install = "npm ci --no-audit --prefer-offline --no-progress --timing";
        default.openFiles = [
          "pages/index.tsx" "pages/index.js"
          "src/pages/index.tsx" "src/pages/index.js"
          "app/page.tsx" "app/page.js"
          "src/app/page.tsx" "src/app/page.js"
        ];
      };
    };

    # Enable previews and customize configuration
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0"];
          manager = "web";
        };
      };
    };
  };
}