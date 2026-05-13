/* Блок объявления системных зависимостей */
# Файл replit.nix представляет собой Nix-выражение — функцию,
# принимающую набор пакетов (pkgs) и возвращающую конфигурацию
{ pkgs }: {
  deps = [
    pkgs.replitPackages.prybar-python310
    pkgs.replitPackages.stderred
  ];
}