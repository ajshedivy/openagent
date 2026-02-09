#!/usr/bin/env bash
set -euo pipefail

MUTED='\033[0;2m'
RED='\033[0;31m'
ORANGE='\033[38;5;214m'
NC='\033[0m' # No Color

usage() {
    cat <<EOF
openagent Local Build Installer

Builds openagent from source and installs to ~/.openagent/bin/

Usage: install.sh [options]

Options:
    -h, --help          Display this help message
    --no-modify-path    Don't modify shell config files (.zshrc, .bashrc, etc.)

Requirements:
    - Bun (https://bun.sh)
    - Git

Examples:
    ./install.sh
    ./install.sh --no-modify-path
EOF
}

no_modify_path=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        -h|--help)
            usage
            exit 0
            ;;
        --no-modify-path)
            no_modify_path=true
            shift
            ;;
        *)
            echo -e "${ORANGE}Warning: Unknown option '$1'${NC}" >&2
            shift
            ;;
    esac
done

# Check dependencies
if ! command -v bun >/dev/null 2>&1; then
    echo -e "${RED}Error: Bun is required but not installed.${NC}"
    echo -e ""
    echo -e "Install Bun from: ${ORANGE}https://bun.sh${NC}"
    echo -e ""
    echo -e "${MUTED}Quick install:${NC}"
    echo -e "  curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

if ! command -v git >/dev/null 2>&1; then
    echo -e "${RED}Error: Git is required but not installed.${NC}"
    exit 1
fi

# Detect repo root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Verify we're in the openagent repo
if [[ ! -f "packages/opencode/package.json" ]]; then
    echo -e "${RED}Error: This script must be run from the openagent repository root${NC}"
    exit 1
fi

echo -e "${MUTED}Building ${NC}openagent${MUTED} from source...${NC}"
echo -e ""

# Install dependencies
echo -e "${MUTED}Installing dependencies...${NC}"
if ! bun install; then
    echo -e "${RED}Error: Failed to install dependencies${NC}"
    exit 1
fi

# Detect platform
raw_os=$(uname -s)
case "$raw_os" in
  Darwin*) os="darwin" ;;
  Linux*) os="linux" ;;
  MINGW*|MSYS*|CYGWIN*) os="windows" ;;
  *)
    echo -e "${RED}Error: Unsupported OS: $raw_os${NC}"
    exit 1
    ;;
esac

arch=$(uname -m)
case "$arch" in
  aarch64) arch="arm64" ;;
  x86_64) arch="x64" ;;
  arm64) arch="arm64" ;;
  *)
    echo -e "${RED}Error: Unsupported architecture: $arch${NC}"
    exit 1
    ;;
esac

# Handle Rosetta on macOS
if [ "$os" = "darwin" ] && [ "$arch" = "x64" ]; then
  rosetta_flag=$(sysctl -n sysctl.proc_translated 2>/dev/null || echo 0)
  if [ "$rosetta_flag" = "1" ]; then
    arch="arm64"
  fi
fi

echo -e "${MUTED}Platform: ${NC}$os-$arch"
echo -e ""

# Build for current platform
echo -e "${MUTED}Building binary (this may take a minute)...${NC}"
cd packages/opencode

# Set version explicitly to avoid npm registry fetch
export OPENCODE_VERSION="0.1.0"

if ! bun run build --single; then
    echo -e "${RED}Error: Build failed${NC}"
    exit 1
fi

cd "$SCRIPT_DIR"

# Locate the built binary
binary_path="packages/opencode/dist/@worksofadam/openagent-$os-$arch/bin/openagent"

if [[ "$os" == "windows" ]]; then
    binary_path="${binary_path}.exe"
fi

if [[ ! -f "$binary_path" ]]; then
    echo -e "${RED}Error: Built binary not found at: $binary_path${NC}"
    echo -e ""
    echo -e "${MUTED}Available builds:${NC}"
    ls -la packages/opencode/dist/ 2>/dev/null || echo "  (none)"
    exit 1
fi

echo -e "${MUTED}Binary built successfully${NC}"
echo -e ""

# Install the binary
INSTALL_DIR="$HOME/.openagent/bin"
mkdir -p "$INSTALL_DIR"

echo -e "${MUTED}Installing to ${NC}$INSTALL_DIR/openagent"
cp "$binary_path" "$INSTALL_DIR/openagent"
chmod +x "$INSTALL_DIR/openagent"

# Verify installation
if ! "$INSTALL_DIR/openagent" --version >/dev/null 2>&1; then
    echo -e "${RED}Error: Installed binary failed version check${NC}"
    exit 1
fi

version=$("$INSTALL_DIR/openagent" --version)

echo -e "${MUTED}Binary: ${NC}$INSTALL_DIR/openagent"
echo -e "${MUTED}Version: ${NC}$version"
echo -e ""

# PATH setup
add_to_path() {
    local config_file=$1
    local command=$2

    if grep -Fxq "$command" "$config_file"; then
        echo -e "${MUTED}PATH already configured in $config_file${NC}"
    elif [[ -w $config_file ]]; then
        echo -e "\n# openagent" >> "$config_file"
        echo "$command" >> "$config_file"
        echo -e "${MUTED}Added to PATH in ${NC}$config_file"
    else
        echo -e "${ORANGE}Warning: Cannot write to $config_file${NC}"
        echo -e "${MUTED}Manually add:${NC}"
        echo -e "  $command"
    fi
}

if [[ "$no_modify_path" != "true" ]]; then
    XDG_CONFIG_HOME=${XDG_CONFIG_HOME:-$HOME/.config}
    current_shell=$(basename "$SHELL")

    case $current_shell in
        fish)
            config_files="$HOME/.config/fish/config.fish"
        ;;
        zsh)
            config_files="${ZDOTDIR:-$HOME}/.zshrc ${ZDOTDIR:-$HOME}/.zshenv $XDG_CONFIG_HOME/zsh/.zshrc $XDG_CONFIG_HOME/zsh/.zshenv"
        ;;
        bash)
            config_files="$HOME/.bashrc $HOME/.bash_profile $HOME/.profile $XDG_CONFIG_HOME/bash/.bashrc $XDG_CONFIG_HOME/bash/.bash_profile"
        ;;
        ash|sh)
            config_files="$HOME/.ashrc $HOME/.profile /etc/profile"
        ;;
        *)
            config_files="$HOME/.bashrc $HOME/.bash_profile $XDG_CONFIG_HOME/bash/.bashrc"
        ;;
    esac

    config_file=""
    for file in $config_files; do
        if [[ -f $file ]]; then
            config_file=$file
            break
        fi
    done

    if [[ -z $config_file ]]; then
        echo -e "${ORANGE}No config file found for $current_shell${NC}"
        echo -e "${MUTED}Manually add to PATH:${NC}"
        echo -e "  export PATH=\$HOME/.openagent/bin:\$PATH"
    elif [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
        case $current_shell in
            fish)
                add_to_path "$config_file" "fish_add_path $INSTALL_DIR"
            ;;
            *)
                add_to_path "$config_file" "export PATH=$INSTALL_DIR:\$PATH"
            ;;
        esac
    fi
fi

# Success message
echo -e ""
echo -e "${MUTED}openagent installed successfully!${NC}"
echo -e ""
echo -e "${MUTED}Binary: ${NC}$INSTALL_DIR/openagent"
echo -e "${MUTED}Version: ${NC}$version"
echo -e ""

if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    echo -e "${MUTED}Restart your shell or run:${NC}"
    echo -e "  export PATH=\$HOME/.openagent/bin:\$PATH"
    echo -e ""
fi

echo -e "${MUTED}Then run:${NC}"
echo -e "  cd <project>"
echo -e "  openagent"
echo -e ""
