import fs from 'fs'
import which from 'which'
import execa, { ExecaSyncReturnValue } from 'execa'
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
  const configFilePathMock = './config/development.yaml'

  const decryptedConfigMock: DecryptedConfig = {
    field: 'asdf',
    fieldSecret: 'PLAIN TEXT',
  }

  const encryptedConfigMock: EncryptedConfig = {
    field: decryptedConfigMock.field,
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

  const encryptedConfigNoSopsMock: EncryptedConfig = dissoc(
    'sops',
    encryptedConfigMock
  )

  let execaSyncMock: jest.SpyInstance
  beforeAll(() => {
    execaSyncMock = jest.spyOn(execa, 'sync')
    execaSyncMock.mockImplementation(() => ({
      exitCode: 0,
      stdout: Buffer.from(JSON.stringify(decryptedConfigMock)),
      stderr: Buffer.from(''),
    }))
  })

  afterAll(() => {
    execaSyncMock.mockRestore()
  })

  describe('getSopsBinary()', () => {
    it('should return `sops` if binary is available in $PATH', () => {
      jest.spyOn(which, 'sync').mockImplementationOnce(() => 'sops')
      const sopsBinary = getSopsBinary()

      expect(sopsBinary).toBe('sops')
    })

    it('should return `./sops` if binary is NOT available in $PATH but has been downloaded to current directory', () => {
      jest.spyOn(which, 'sync').mockImplementationOnce(() => '')
      jest.spyOn(fs, 'existsSync').mockImplementationOnce(() => true)
      const sopsBinary = getSopsBinary()

      expect(sopsBinary).toBe('./sops')
    })

    it('should throw if binary is neither available in $PATH nor in current directory', () => {
      jest.spyOn(which, 'sync').mockImplementationOnce(() => '')
      jest.spyOn(fs, 'existsSync').mockImplementationOnce(() => false)

      expect(getSopsBinary).toThrowError(sopsErrors['SOPS_NOT_FOUND'])
    })
  })

  describe('getSopsOptions()', () => {
    it('should pass the correct key-provider options', () => {
      const pgp = getSopsOptions(
        {},
        { 'key-provider': 'pgp', 'key-id': '123abc' }
      )
      const gcp = getSopsOptions(
        {},
        { 'key-provider': 'gcp', 'key-id': '123abc' }
      )
      const aws = getSopsOptions(
        {},
        { 'key-provider': 'aws', 'key-id': '123abc' }
      )
      const azr = getSopsOptions(
        {},
        { 'key-provider': 'azr', 'key-id': '123abc' }
      )
      expect(pgp).toContain('--pgp')
      expect(gcp).toContain('--gcp-kms')
      expect(aws).toContain('--kms')
      expect(azr).toContain('--azure-kv')

      expect(() =>
        getSopsOptions({}, { 'key-provider': 'your-mama', 'key-id': '123abc' })
      ).toThrowError(sopsErrors['UNSUPPORTED_KEY_PROVIDER'])
    })
  })

  describe('runSopsWithOptions()', () => {
    it('should pass options to underlying sops binary', () => {
      jest.spyOn(which, 'sync').mockImplementationOnce(() => 'sops')
      const execaSyncSpy = jest.spyOn(execa, 'sync')
      runSopsWithOptions(['--help'])
      expect(execaSyncSpy).toHaveBeenCalledWith('sops', ['--help'])
    })
  })

  describe('decryptToObject()', () => {
    it('returns the parsed config as-is when it does not contain SOPS metadata (nothing to decrypt)', () => {
      expect(
        decryptToObject(configFilePathMock, encryptedConfigNoSopsMock)
      ).toEqual(encryptedConfigNoSopsMock)
    })

    it('calls the sops binary to decrypt when SOPS metadata is present', () => {
      decryptToObject(configFilePathMock, encryptedConfigMock)

      expect(execaSyncMock).toHaveBeenCalledWith('sops', [
        '--decrypt',
        configFilePathMock,
      ])
    })

    it('throws when SOPS binary encounters an error while decrypting the config', () => {
      execaSyncMock.mockImplementationOnce(
        () =>
          ({
            exitCode: 1,
            stdout: Buffer.from('some stdout'),
            stderr: Buffer.from('non-empty stderr'),
          } as ExecaSyncReturnValue<Buffer>)
      )

      expect(() =>
        decryptToObject(configFilePathMock, encryptedConfigMock)
      ).toThrow(Error)
    })

    it('parses the output of SOPS to YAML', () => {
      jest.spyOn(yaml, 'load')
      decryptToObject(configFilePathMock, encryptedConfigMock)

      expect(yaml.load).toHaveBeenCalledWith(
        JSON.stringify(decryptedConfigMock)
      )
    })
  })

  describe('decryptInPlace()', () => {
    it('calls the SOPS binary with the flag "--in-place"', () => {
      decryptInPlace(configFilePathMock)

      expect(execaSyncMock).toHaveBeenCalledWith(
        'sops',
        expect.arrayContaining(['--in-place'])
      )
    })
  })
})
