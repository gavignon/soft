# summary

Create field as SFDX files from a CVS file.

# description

Fields file generation from a CSV file with basic validation.
Files will be created in <folder>/main/default/object/<object name>/
<folder> can be the SFDX Project in which the command is executed or a specific one (--output-directory or -d flag)

# examples

- soft field generate -f ../test.csv -d ../generation
- soft field generate -f ../test.csv

# flags.definition-file.summary

Filepath to the CSV file that contains the definition of the fields to generate.
The first line of the CSV file must have keys. Order of keys is not important.

--Standard keys--
objectName
label
fullname
type
description
inlineHelpText
FieldIsIndexed
defaultValue
required
trackHistory
externalId
unique

--Numeric related keys--
numeric-precision
numeric-scale
number-isAIPredictionField

--Lookup related keys--
lookup-referenceTo
lookup-relationshipLabel
lookup-relationshipName
lookup-deleteConstraint

--Text related keys--
autonumber-displayFormat
text-caseSensitive
text-length
text-visibleLines

--Encrypt related keys--
encrypt-maskType
encrypt-maskChar

--Location related keys--
geo-displayLocationInDecimal

--Rollup summary keys--
rollup-field
rollup-foreignkey
rollup-Operation

--Picklist related keys--
picklist-isGlobal
picklist-restricted
picklist-valueSetName
picklist-isSorted

# flags.output-dir.summary

Directory for saving the created files.
If not provided, package directories of the current Project will be listed to allow you to determine where to generate files.

# flags.verbose.summary

Display more messages in the console at runtime.
