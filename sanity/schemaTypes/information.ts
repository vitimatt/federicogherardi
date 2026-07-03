import { defineField, defineType } from 'sanity';

export const informationType = defineType({
  name: 'information',
  title: 'Information',
  type: 'document',
  fields: [
    defineField({
      name: 'openingImage',
      title: 'Opening Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Centered image shown when the website first opens',
    }),
    defineField({
      name: 'instagram',
      title: 'Instagram',
      type: 'string',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
    }),
    defineField({
      name: 'about',
      title: 'About',
      type: 'text',
      rows: 6,
    }),
    defineField({
      name: 'clientList',
      title: 'Client List',
      type: 'array',
      of: [{ type: 'string' }],
    }),
  ],
});
