import R from 'ramda'
import { ExecaSyncReturnValue } from 'execa'

jest.mock('execa')
jest.mock('js-yaml')
const mockedFilePath = './config/development.yaml'
const mockedParsedConfig: EncryptedConfig = {
  field: 'asdf',
  fieldSecret: 'ENC[some encrypted value]',
  sops: {
    key: 'value',
  },
}
const mockedDecryptedConfigAsString: string = JSON.stringify({
  field: 'asdf',
  fieldSecret: 'PLAIN TEXT',
})
const mockedParsedConfigNoSops: EncryptedConfig = R.dissoc(
  'sops',
  mockedParsedConfig
)
import execa from 'execa'
const mockedExeca = execa as jest.Mocked<typeof execa>
mockedExeca.sync = jest.fn().mockReturnValue({
  stdout: mockedDecryptedConfigAsString,
  stderr: '',
})
import yaml from 'js-yaml'
const mockedYaml = yaml as jest.Mocked<typeof yaml>
mockedYaml.load = jest.fn().mockReturnValue('some: yaml')

import { decryptToObject, decryptInPlace } from './sops'

describe('decryptToObject()', () => {
  it('returns the parsed config as-is when it does not contain SOPS metadata (nothing to decrypt)', () => {
    const result = decryptToObject(mockedFilePath, mockedParsedConfigNoSops)

    expect(result).toEqual(mockedParsedConfigNoSops)
  })

  it('calls sops binary to decrypt in case there is SOPS metadata present', () => {
    decryptToObject(mockedFilePath, mockedParsedConfig)

    expect(mockedExeca.sync).toHaveBeenCalledWith('sops', [
      '--decrypt',
      mockedFilePath,
    ])
  })

  it('throws when SOPS binary encounters an error while decrypting the config', () => {
    mockedExeca.sync.mockReturnValueOnce({
      stdout: Buffer.from('some stdout'),
      stderr: Buffer.from('non-empty stderr'),
    } as ExecaSyncReturnValue<Buffer>)

    expect(() => decryptToObject(mockedFilePath, mockedParsedConfig)).toThrow(
      Error
    )
  })

  it('parses the output of SOPS as YAML', () => {
    decryptToObject(mockedFilePath, mockedParsedConfig)

    expect(mockedYaml.load).toHaveBeenCalledWith(mockedDecryptedConfigAsString)
  })
})

describe('decryptInPlace()', () => {
  it('calls the SOPS binary with the flag "--in-place"', () => {
    decryptInPlace(mockedFilePath)

    expect(mockedExeca.sync).toHaveBeenCalledWith(
      'sops',
      expect.arrayContaining(['--in-place'])
    )
  })
})
