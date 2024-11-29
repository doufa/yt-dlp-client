import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import path from 'path';

const config: ForgeConfig = {
  packagerConfig: {
    extraResource: [
      path.join(__dirname, 'lib')
    ],
    icon: './assets/icons/icon',
    asar: true,
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      iconUrl: 'https://raw.githubusercontent.com/doufa/yt-dlp-client/main/assets/icons/icon.ico',
      setupIcon: './assets/icons/icon.ico'
    }),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({
      options: {
        icon: './assets/icons/png/512x512.png'
      }
    }),
    new MakerDeb({
      options: {
        icon: './assets/icons/png/512x512.png'
      }
    })
  ],
  plugins: [
    new WebpackPlugin({
      mainConfig: {
        entry: './src/main/main.ts',
        module: {
          rules: [
            {
              test: /\.tsx?$/,
              exclude: /(node_modules|\.webpack)/,
              use: {
                loader: 'ts-loader',
                options: {
                  transpileOnly: true,
                }
              }
            }
          ]
        },
        resolve: {
          extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json']
        },
      },
      renderer: {
        config: {
          entry: ['./src/renderer/index.tsx'],
          module: {
            rules: [
              {
                test: /\.tsx?$/,
                exclude: /(node_modules|\.webpack)/,
                use: {
                  loader: 'ts-loader',
                  options: {
                    transpileOnly: true,
                  }
                }
              },
              {
                test: /\.css$/,
                use: [
                  'style-loader',
                  'css-loader',
                  {
                    loader: 'postcss-loader',
                    options: {
                      postcssOptions: {
                        plugins: [
                          require('tailwindcss'),
                          require('autoprefixer'),
                        ],
                      },
                    },
                  },
                ],
              }
            ]
          },
          resolve: {
            extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
            modules: ['node_modules', 'src']
          }
        },
        entryPoints: [
          {
            html: './src/renderer/index.html',
            js: './src/renderer/index.tsx',
            name: 'main_window',
            preload: {
              js: './src/main/preload.ts',
            },
          },
        ],
      },
    }),
  ],
};

export default config;