import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list';
import type { StructureBuilder, StructureResolverContext } from 'sanity/structure';

export const structure = (
  S: StructureBuilder,
  context: StructureResolverContext,
) =>
  S.list()
    .title('Content')
    .items([
      orderableDocumentListDeskItem({
        type: 'project',
        title: 'Projects',
        S,
        context,
      }),
      S.listItem()
        .title('Information')
        .child(
          S.document().schemaType('information').documentId('information'),
        ),
    ]);
