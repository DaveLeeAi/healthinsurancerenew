import Script from 'next/script'

interface Props {
  schema: object
  id: string
}

export default function SchemaScript({ schema, id }: Props) {
  return (
    <Script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
