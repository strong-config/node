/*
 * We can't use the newest version of 'execa' yet as it's ESM-only which requires a
 * lot of setup work that we haven't had time to do yet.
 */
/* eslint-disable @typescript-eslint/unbound-method */
import fs from 'fs'
import which from 'which'
import execa from 'execa'
import yaml from 'js-yaml'
import { dissoc } from 'ramda'
import type { DecryptedConfig, EncryptedConfig } from '../types'
import {
  getSopsBinary,
  getSopsOptions,
  decryptInPlace,
  decryptToObject,
  runSopsWithOptions,
  sopsErrors,
} from './sops'

describe('utils :: sops', () => {
  const configFilePath = './config/development.yaml'
  const args = { config_file: './config/development.yaml' }

  const decryptedConfig: DecryptedConfig = {
    field: 'asdf',
    fieldSecret: 'PLAIN TEXT',
  }

  describe('getSopsBinary()', () => {
    it('should return `sops` if binary is available in $PATH', () => {
      jest.spyOn(which, 'sync').mockReturnValueOnce('sops')

      expect(getSopsBinary()).toBe('sops')
    })

    it('should return `./sops` if binary is NOT available in $PATH but has been downloaded to current directory', () => {
      jest.spyOn(which, 'sync').mockReturnValueOnce('')
      jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true)

      expect(getSopsBinary()).toBe('./sops')
    })

    it('should throw if binary is neither available in $PATH nor in current directory', () => {
      jest.spyOn(which, 'sync').mockReturnValueOnce('')
      jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false)

      expect(getSopsBinary).toThrow(sopsErrors['SOPS_NOT_FOUND'])
    })
  })

  describe('getSopsOptions()', () => {
    it('should pass the correct key-provider options', () => {
      const pgp = getSopsOptions(args, {
        'key-provider': 'pgp',
        'key-id': '123abc',
      })
      const gcp = getSopsOptions(args, {
        'key-provider': 'gcp',
        'key-id': '123abc',
      })
      const aws = getSopsOptions(args, {
        'key-provider': 'aws',
        'key-id': '123abc',
      })
      const azr = getSopsOptions(args, {
        'key-provider': 'azr',
        'key-id': '123abc',
      })

      expect(pgp).toContain('--pgp')
      expect(gcp).toContain('--gcp-kms')
      expect(aws).toContain('--kms')
      expect(azr).toContain('--azure-kv')

      expect(() =>
        getSopsOptions({}, { 'key-provider': 'your-mama', 'key-id': '123abc' })
      ).toThrow(sopsErrors['UNSUPPORTED_KEY_PROVIDER'])
    })

    describe('given an output_path', () => {
      it('should pass an --output param to sops', () => {
        const output_path = './config/development.yml'
        const options = getSopsOptions({ ...args, output_path }, {})

        expect(options).toContain('--output')
        expect(options).toContain(output_path)
      })
    })

    describe('given NO output_path', () => {
      it('should pass an --in-place param to sops', () => {
        const options = getSopsOptions(args, {})

        expect(options).toContain('--in-place')
      })
    })

    describe('given an unencrypted-key-suffix and NO encrypted-key-suffix', () => {
      it('should pass the unencrypted-key-suffix to sops', () => {
        const unencryptedSuffix = 'NotASecret'
        const options = getSopsOptions(args, {
          'key-provider': 'pgp',
          'unencrypted-key-suffix': unencryptedSuffix,
        })

        expect(options).toContain('--unencrypted-suffix')
        expect(options).toContain(unencryptedSuffix)
        expect(options).not.toContain('--encrypted-suffix')
      })
    })

    describe('given an encrypted-key-suffix and NO unencrypted-key-suffix', () => {
      it('should pass the encrypted-key-suffix to sops', () => {
        const encryptedSuffix = 'TopSecret'
        const options = getSopsOptions(args, {
          'key-provider': 'pgp',
          'encrypted-key-suffix': encryptedSuffix,
        })

        expect(options).toContain('--encrypted-suffix')
        expect(options).toContain(encryptedSuffix)
        expect(options).not.toContain('--unencrypted-suffix')
      })
    })

    describe('given an encrypted-key-suffix AND an unencrypted-key-suffix', () => {
      it('should throw an error because these options are mutually exclusive', () => {
        expect(() =>
          getSopsOptions(args, {
            'key-provider': 'aws',
            'encrypted-key-suffix': 'Secret',
            'unencrypted-key-suffix': 'NotSoSecret',
          })
        ).toThrow(sopsErrors['KEY_SUFFIX_CONFLICT'])
      })
    })

    describe('given a verbose flag', () => {
      it('runs sops in verbose mode', () => {
        const options = getSopsOptions(args, {
          'key-provider': 'aws',
          verbose: true,
        })

        expect(options).toContain('--verbose')
      })
    })

    describe('given an invalid config file', () => {
      it('should throw an error', () => {
        expect(() =>
          getSopsOptions(
            { config_file: undefined },
            {
              'key-provider': 'aws',
              'encrypted-key-suffix': 'Secret',
            }
          )
        ).toThrow(sopsErrors['NO_CONFIG_FILE'])
      })
    })
  })

  describe('runSopsWithOptions()', () => {
    it('should pass options to underlying sops binary', () => {
      jest.spyOn(which, 'sync').mockReturnValueOnce('sops')
      jest.spyOn(execa, 'sync')

      runSopsWithOptions(['--help'])

      expect(execa.sync).toHaveBeenCalledWith('sops', ['--help'])
    })

    it('should handle decryption errors', () => {
      const execaSyncDecryptFail = {
        exitCode: 128,
        stdout: Buffer.from(''),
        stderr: Buffer.from(JSON.stringify(decryptedConfig)),
        command: 'sops',
        escapedCommand: 'sops',
        failed: true,
        timedOut: false,
        killed: false,
      }

      jest.spyOn(execa, 'sync').mockReturnValueOnce(execaSyncDecryptFail)

      expect(() => runSopsWithOptions(['decrypt'])).toThrow(
        sopsErrors['DECRYPTION_ERROR']
      )
    })
  })

  describe('decrypt', () => {
    const execaSyncSuccess = {
      exitCode: 0,
      stdout: Buffer.from(JSON.stringify(decryptedConfig)),
      stderr: Buffer.from(''),
      command: 'sops',
      escapedCommand: 'sops',
      failed: false,
      timedOut: false,
      killed: false,
    }

    const execaSyncFail = {
      exitCode: 1,
      stdout: Buffer.from(''),
      stderr: Buffer.from(JSON.stringify(decryptedConfig)),
      command: 'sops',
      escapedCommand: 'sops',
      failed: true,
      timedOut: false,
      killed: false,
    }

    describe('decryptToObject()', () => {
      const encryptedConfig: EncryptedConfig = {
        field: decryptedConfig.field,
        fieldSecret: 'ENC[some encrypted value]',
        sops: {
          kms: 'data',
          gcp_kms: 'data',
          azure_kv: 'data',
          pgp: 'data',
          lastmodified: 'timestamp',
          mac: 'data',
          version: 'version',
        },
      }

      const encryptedConfigNoSops: EncryptedConfig = dissoc(
        'sops',
        encryptedConfig
      )

      it('returns the parsed config as-is when it does not contain SOPS metadata (nothing to decrypt)', () => {
        expect(
          decryptToObject(configFilePath, encryptedConfigNoSops)
        ).toStrictEqual(encryptedConfigNoSops)
      })

      it('calls the sops binary to decrypt when SOPS metadata is present', () => {
        jest.spyOn(execa, 'sync').mockReturnValueOnce(execaSyncSuccess)
        decryptToObject(configFilePath, encryptedConfig)

        expect(execa.sync).toHaveBeenCalledWith('sops', [
          '--decrypt',
          configFilePath,
        ])
      })

      it('throws when SOPS binary encounters an error while decrypting the config', () => {
        jest.spyOn(execa, 'sync').mockReturnValueOnce(execaSyncFail)

        expect(() => decryptToObject(configFilePath, encryptedConfig)).toThrow(
          Error
        )
      })

      /* eslint-disable @typescript-eslint/ban-ts-comment, unicorn/no-useless-undefined -- explicitly testing an error case here */
      it('throws when `parsedConfig` parameter is nil', () => {
        // @ts-ignore
        expect(() => decryptToObject(configFilePath, undefined)).toThrow(
          'Config is nil and can not be decrytped'
        )

        // @ts-ignore
        expect(() => decryptToObject(configFilePath, null)).toThrow(
          'Config is nil and can not be decrytped'
        )
      })
      /* eslint-enable @typescript-eslint/ban-ts-comment, unicorn/no-useless-undefined */

      it('parses the output of SOPS to YAML', () => {
        jest.spyOn(execa, 'sync').mockReturnValueOnce(execaSyncSuccess)
        jest.spyOn(yaml, 'load')
        decryptToObject(configFilePath, encryptedConfig)

        expect(yaml.load).toHaveBeenCalledWith(JSON.stringify(decryptedConfig))
      })
    })

    describe('decryptInPlace()', () => {
      it('calls sops with the "--in-place" flag', () => {
        // eslint-disable @typescript-eslint/unbound-method
        jest.spyOn(execa, 'sync').mockReturnValueOnce(execaSyncSuccess)
        decryptInPlace(configFilePath)

        expect(execa.sync).toHaveBeenCalledWith(
          'sops',
          expect.arrayContaining(['--in-place'])
        )
      })
    })
  })
})
