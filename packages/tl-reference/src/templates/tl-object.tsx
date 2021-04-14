import React, { useMemo } from 'react'
import { graphql } from 'gatsby'
import { ExtendedTlObject } from '../types'
import {
    Description,
    Page,
    Section,
    SectionWithList,
    usePageStyles,
} from '../components/page'
import {
    Breadcrumbs,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from '@material-ui/core'
import {
    createStyles,
    Link as MuiLink,
    makeStyles,
    Typography,
} from '@material-ui/core'
import { Link } from 'gatsby'
import { LinkToTl } from '../components/objects/link-to-tl'
import { TableOfContentsItem } from '../components/table-of-contents'
import { Helmet } from 'react-helmet'

interface GraphqlResult {
    self: ExtendedTlObject
    parent: ExtendedTlObject
    children: { nodes: ExtendedTlObject[] }
    usageMethods: { nodes: ExtendedTlObject[] }
    usageTypes: { nodes: ExtendedTlObject[] }
}

const useStyles = makeStyles((theme) =>
    createStyles({
        description: {
            marginBottom: theme.spacing(2),
            fontSize: 16,
        },
        table: {
            '& th, & td': {
                fontSize: 15,
            },
        },
        mono: {
            fontFamily: 'Fira Mono, Consolas, monospace',
        },
        // theme ported from one dark
        code: {
            fontFamily: 'Fira Mono, Consolas, monospace',
            background: '#282c34',
            color: '#bbbbbb',
            fontSize: 16,
            borderRadius: 4,
            overflowX: 'auto',
            padding: 8,
        },
        keyword: {
            fontStyle: 'italic',
            color: '#c678dd',
        },
        identifier: {
            color: '#e5c07b',
        },
        property: {
            color: '#e06c75',
        },
        comment: {
            color: '#5c6370',
        },
        string: {
            color: '#98c379',
        },
    })
)

function useToc(obj: ExtendedTlObject): TableOfContentsItem[] {
    return useMemo(() => {
        const ret = [{ id: 'title', title: obj.prefix + obj.name }]

        if (obj.type !== 'union') {
            ret.push({ id: 'parameters', title: 'Parameters' })
        } else {
            ret.push({ id: 'subtypes', title: 'Subtypes' })
            ret.push({ id: 'usage', title: 'Usage' })
        }

        if (obj.type === 'method' && obj.throws) {
            ret.push({ id: 'throws', title: 'Throws' })
        }

        ret.push({ id: 'typescript', title: 'TypeScript' })

        return ret
    }, [obj])
}

export default function TlObject({ data }: { data: GraphqlResult }) {
    const pageClasses = usePageStyles()
    const classes = useStyles()

    const obj = data.self
    const toc = useToc(obj)

    const keyword = (s: string) =>
        `<span class='${classes.keyword}'>${s}</span>`
    const identifier = (s: string) =>
        `<span class='${classes.identifier}'>${s}</span>`
    const property = (s: string) =>
        `<span class='${classes.property}'>${s}</span>`
    const comment = (s: string) =>
        `<span class='${classes.comment}'>${s}</span>`
    const _string = (s: string) => `<span class='${classes.string}'>${s}</span>`

    const typeName = (s: string): string => {
        if (
            s === 'string' ||
            s === 'number' ||
            s === 'boolean' ||
            s === 'true'
        ) {
            return keyword(s)
        }

        if (s.substr(s.length - 2) === '[]')
            return typeName(s.substr(0, s.length - 2)) + '[]'

        return s.split('.').map(identifier).join('.')
    }

    const code = (s: string) => {
        return (
            <pre
                className={classes.code}
                dangerouslySetInnerHTML={{ __html: s }}
            />
        )
    }

    return (
        <Page toc={toc}>
            <Helmet>
                <title>
                    {obj.prefix}
                    {obj.name}
                </title>
                <meta
                    name="description"
                    content={
                        obj.description ||
                        obj.prefix + obj.name + " currently doesn't have a description."
                    }
                />
            </Helmet>

            <div className={pageClasses.heading0}>
                <Breadcrumbs>
                    <MuiLink
                        component={Link}
                        to={`/${obj.prefix}${
                            obj.type === 'method' ? 'methods' : 'types'
                        }`}
                    >
                        {obj.prefix}
                        {obj.type === 'method' ? 'Methods' : 'Types'}
                    </MuiLink>
                    {obj.namespace !== '$root' && (
                        <MuiLink
                            component={Link}
                            to={`/${obj.prefix}${
                                obj.type === 'method' ? 'methods' : 'types'
                            }/${obj.namespace}`}
                        >
                            {obj.prefix}
                            {obj.namespace}
                        </MuiLink>
                    )}
                    <Typography color="textPrimary">{obj.name}</Typography>
                </Breadcrumbs>
                <Typography variant="h3" id="title">
                    {obj.prefix}
                    {obj.name}
                </Typography>
                <Typography variant="body2">
                    {obj.type === 'class' ? (
                        <>
                            constructor ID 0x{obj.tlId} / belongs to union{' '}
                            {LinkToTl(data.parent)}
                        </>
                    ) : obj.type === 'union' ? (
                        <>
                            has{' '}
                            <MuiLink href="#subtypes">
                                {data.children.nodes.length} sub-types
                            </MuiLink>{' '}
                            and{' '}
                            <MuiLink href="#usage">
                                {data.usageTypes.nodes.length +
                                    data.usageMethods.nodes.length}{' '}
                                usages
                            </MuiLink>
                        </>
                    ) : (
                        obj.returns && (
                            <>
                                constructor ID 0x{obj.tlId} / returns{' '}
                                {LinkToTl(obj.returns)}
                                {obj.available &&
                                    ' / available for ' +
                                        (obj.available === 'both'
                                            ? 'both users and bots'
                                            : obj.available + 's only')}
                            </>
                        )
                    )}
                </Typography>
            </div>
            <Description
                description={obj.description}
                className={classes.description}
            />
            {obj.type !== 'union' && (
                <Section id="parameters" title="Parameters">
                    <Table className={classes.table}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Description</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {obj.arguments.map((arg) => (
                                <TableRow key={arg.name}>
                                    <TableCell>
                                        <code>{arg.name}</code>
                                    </TableCell>
                                    <TableCell className={classes.mono}>
                                        {LinkToTl(arg.type)}
                                        {arg.optional ? '?' : ''}
                                    </TableCell>
                                    <Description
                                        description={arg.description}
                                        component={TableCell}
                                    />
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Section>
            )}
            {obj.type === 'union' && (
                <>
                    <SectionWithList
                        id="subtypes"
                        title="Subtypes"
                        nodes={data.children.nodes}
                    >
                        {obj.prefix}
                        {obj.name} can be represented with{' '}
                        {obj.subtypes.length > 1
                            ? `one of ${obj.subtypes.length} classes`
                            : 'only one class'}
                        :
                    </SectionWithList>

                    <Section id="usage" title="Usage">
                        {data.usageMethods.nodes.length > 0 && (
                            <SectionWithList nodes={data.usageMethods.nodes}>
                                {obj.prefix}
                                {obj.name} is returned by{' '}
                                {data.usageMethods.nodes.length > 1
                                    ? `${data.usageMethods.nodes.length} methods`
                                    : 'only one method'}
                                :
                            </SectionWithList>
                        )}

                        {data.usageTypes.nodes.length > 0 && (
                            <SectionWithList nodes={data.usageTypes.nodes}>
                                {obj.prefix}
                                {obj.name} is used in{' '}
                                {data.usageTypes.nodes.length > 1
                                    ? `${data.usageTypes.nodes.length} types`
                                    : 'only one type'}
                                :
                            </SectionWithList>
                        )}

                        {data.usageMethods.nodes.length === 0 &&
                            data.usageTypes.nodes.length === 0 && (
                                <Typography color="textSecondary">
                                    This union is never used :(
                                </Typography>
                            )}
                    </Section>
                </>
            )}
            {obj.throws && (
                <Section id="throws" title="Throws">
                    <Table className={classes.table}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Code</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Description</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {obj.throws.map((err) => (
                                <TableRow key={err.name}>
                                    <TableCell>
                                        <code>{err.code}</code>
                                    </TableCell>
                                    <TableCell>
                                        <code>{err.name}</code>
                                    </TableCell>
                                    <Description
                                        description={err.description}
                                        component={TableCell}
                                    />
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Section>
            )}
            <Typography
                variant="h4"
                id="typescript"
                className={pageClasses.heading}
            >
                TypeScript declaration
            </Typography>

            {/* this is a mess, but who cares */}
            {code(
                obj.type === 'union'
                    ? `${keyword('export type')} ${identifier(obj.ts)} =` +
                          data.children.nodes
                              .map(
                                  (it) =>
                                      `\n    | ${typeName(
                                          'tl.' +
                                              (it.namespace === '$root'
                                                  ? it.prefix === 'mtproto/'
                                                      ? 'mtproto.'
                                                      : ''
                                                  : it.namespace + '.') +
                                              it.ts
                                      )}`
                              )
                              .join('')
                    : `${keyword('export interface')} ${identifier(obj.ts)} {` +
                          `\n    ${property('_')}: ${_string(
                              `'${obj.prefix === 'mtproto/' ? 'mt_' : ''}${
                                  obj.name
                              }'`
                          )}` +
                          obj.arguments
                              .map((arg) =>
                                  arg.type === '$FlagsBitField'
                                      ? comment(
                                            '\n    // ' +
                                                arg.name +
                                                ': TlFlags // handled automatically'
                                        )
                                      : `\n    ${property(arg.name)}${
                                            arg.optional ? '?' : ''
                                        }: ${typeName(arg.ts)}${
                                            arg.predicate
                                                ? ' ' +
                                                  comment(
                                                      '// present if ' +
                                                          arg.predicate
                                                  )
                                                : ''
                                        }`
                              )
                              .join('') +
                          '\n}'
            )}
        </Page>
    )
}

export const query = graphql`
    query(
        $prefix: String!
        $type: String!
        $name: String!
        $hasSubtypes: Boolean!
        $subtypes: [String]
    ) {
        self: tlObject(
            prefix: { eq: $prefix }
            type: { eq: $type }
            name: { eq: $name }
        ) {
            tlId
            ts
            prefix
            type
            name
            description
            namespace
            returns
            available
            arguments {
                name
                ts
                type
                description
                optional
                predicate
            }
            subtypes
            throws {
                code
                description
                name
            }
        }
        parent: tlObject(
            prefix: { eq: $prefix }
            type: { eq: "union" }
            subtypes: { eq: $name }
        ) {
            prefix
            name
            type
            description
            subtypes
        }
        children: allTlObject(
            filter: {
                prefix: { eq: $prefix }
                type: { eq: "class" }
                name: { in: $subtypes }
            }
        ) @include(if: $hasSubtypes) {
            nodes {
                ts
                id
                namespace
                prefix
                name
                type
                description
            }
        }
        usageMethods: allTlObject(
            filter: {
                prefix: { eq: $prefix }
                type: { eq: "method" }
                returns: { eq: $name }
            }
        ) @include(if: $hasSubtypes) {
            nodes {
                id
                prefix
                type
                name
                description
            }
        }
        usageTypes: allTlObject(
            filter: {
                prefix: { eq: $prefix }
                arguments: { elemMatch: { rawType: { eq: $name } } }
            }
        ) {
            nodes {
                id
                prefix
                type
                name
                description
            }
        }
    }
`
