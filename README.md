# soft

Salesforce Open source Framework Tools is a Salesforce France employee initiative to create tools useful in our day-to-day life as developers and advisors.

# Salesforce CLI plugins

## Field generation

This plugin allows you to easily create fields from a CSV file
It's the companion of the "Create object" feature available in your org but it only can be use when you create a custom object.

### How to use it?

To use the plugin, type this command:

> soft field generate --definition-file <value> [--output-dir <value>][--verbose]
> soft field generate -f <value> [-d <value>][-v]

It comes with 3 flags

- -d, --output-dir=<value>
  You can define here a folder where the files will be generated

If you don't provide this flag and you execute this command from a SFDX Project folder, it will prompt you to choose in which package folder you want to generate them

- -f, --definition-file=<value> `REQUIRED`
  Filepath to the CSV file that contains the definition of the fields to generate.
  The first line of the CSV file must have keys. Order of keys is not important and you don't have to provide each of them but only the one which are useful depending on the field type you are created.

- -v, --verbose
  Provides more information from the command on the screen at runtime

### What are the keys of the CSV file?

- Standard keys
- objectName: string, Define the object to which this field should belong
- label
- fullname
- type
- description
- inlineHelpText
- FieldIsIndexed
- defaultValue
- required
- trackHistory
- externalId
- unique

- Numeric related keys
- numeric-precision
- numeric-scale
- number-isAIPredictionField

- Lookup related keys
- lookup-referenceTo
- lookup-relationshipLabel
- lookup-relationshipName
- lookup-deleteConstraint

- Text related keys
- autonumber-displayFormat
- text-caseSensitive
- text-length
- text-visibleLines

- Encrypt related keys
- encrypt-maskType
- encrypt-maskChar

- Location related keys
- geo-displayLocationInDecimal

- Rollup summary keys
- rollup-field
- rollup-foreignkey
- rollup-Operation

- Picklist related keys
- picklist-isGlobal: boolean, define if the picklist is based on a global value set or not
- picklist-restricted
- picklist-valueSetName
- picklist-isSorted

### Are there some specific values to provide for some keys?

- type, define the type of field to generate
- AutoNumber
- Checkbox
- Currency
- Date
- DateTime
- Email
- EncryptedText
- Html
- Location
- LongTextArea
- Lookup
- MultiselectPicklist
- Number
- Percent
- Phone
- Picklist
- Summary
- Text
- TextArea
- Time
- Url

- encrypt-maskType, for Encrypt fields
- all
- creditCard
- lastFour
- nino
- sin
- ssn

- encrypt-maskChar
- -
- X

- lookup-deleteConstraint
- Restrict
- Cascade
- SetNull

- rollup-Operation
- Count
- Min
- Max
- Sum

### What do I have to know?

1. The plugin won't validate anything but the field's structure
2. The plugins will generate files under the folder you choosed and under "main/default/<objectName>"
3. Picklist with `picklist-isGlobal` set to `false`, a sample of 2 value items will be generated
4. Recommanded key information for a field type will be only displayed with the -v / --verbose flag
5. Required keys for a field type will exclude the field from the field generation, a warning will be raised.

Example:

> Warning: #2 Field Error.myAutonumberBad\_\_c skipped due to 1 errors (and 1 warnings)
> Warning: REQUIRED>#2 autonumber-displayFormat is missing
> Verbose: RECOMMANDED>#2 description is missing

Where `#2` indicates the line in the CSV file

## Install

To come soon

## Issues

Probably to come :sweat_smile:

## Test results

Within a valid Salesforce DX project
✔ Should generate 23 files without error in a SFDX project Folder

Without a valid Salesforce DX project
✔ Should generate 23 files without error in a specific folder
✔ Should throw an SF Exception (not a valid Salesforce DX project)

3 passing (9s)

---------------------|---------|----------|---------|---------|-------------------
File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
---------------------|---------|----------|---------|---------|-------------------
All files | 98.24 | 94.44 | 98.03 | 98.23 |
commands/soft/field | 96.03 | 87.5 | 94.11 | 96.03 |
generate.ts | 96.03 | 87.5 | 94.11 | 96.03 | 179-180,205,277
lib/soft/field | 99.45 | 96.42 | 100 | 99.45 |
fieldDefinition.ts | 99.45 | 96.42 | 100 | 99.45 | 635
---------------------|---------|----------|---------|---------|-------------------
