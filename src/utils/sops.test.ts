import execa from 'execa'
import yaml from 'js-yaml'
import { dissoc } from 'ramda'
import { EncryptedConfig, DecryptedConfig } from '../types'
import { ExecaSyncReturnValue } from 'execa'
import { decryptToObject, decryptInPlace } from './sops'

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

  describe('decryptToObject()', () => {
    it('returns the parsed config as-is when it does not contain SOPS metadata (nothing to decrypt)', () => {
      expect(
        decryptToObject(configFilePathMock, encryptedConfigNoSopsMock)
      ).toEqual(encryptedConfigNoSopsMock)
    })

    it('calls the sops binary to decrypt when SOPS metadata is present', () => {
      decryptToObject(configFilePathMock, encryptedConfigMock)

      expect(execa.sync).toHaveBeenCalledWith('sops', [
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

      expect(execa.sync).toHaveBeenCalledWith(
        'sops',
        expect.arrayContaining(['--in-place'])
      )
    })
  })
})
