schemaString = `
"""
Exposes linked data context mapppings for this schema. Response to the full
_CONTEXT query returns a valid JSON-LD context sufficient to interpret data
returned by other queries and inserted via mutations.
"""
type _CONTEXT {
  """@id"""
  _id: String

  """@value"""
  _value: String

  """@type"""
  _type: String

  """@reverse"""
  _reverse: String

  """http://schema.org/Thing"""
  Thing: String

  """http://schema.org/Organization"""
  Organization: String

  """http://schema.org/Person"""
  Person: String

  """http://schema.org/Country"""
  Country: String

  """http://schema.org/Place"""
  Place: String

  """http://schema.org/PostalAddress"""
  PostalAddress: String

  """http://schema.org/Product"""
  Product: String

  """http://schema.org/Service"""
  Service: String

  """http://schema.org/CreativeWork"""
  CreativeWork: String

  """http://schema.org/Offer"""
  Offer: String

  """http://schema.org/Text"""
  Text: String

  """http://schema.org/Date"""
  Date: String

  """http://schema.org/Number"""
  Number: String

  """http://schema.org/Integer"""
  Integer: String

  """http://schema.org/employee"""
  employee: String

  """http://schema.org/worksFor"""
  worksFor: String

  """http://schema.org/name"""
  name: String

  """http://schema.org/legalName"""
  legalName: String

  """http://schema.org/funder"""
  funder: String

  """http://schema.org/address"""
  address: String

  """http://schema.org/addressCountry"""
  addressCountry: String

  """http://schema.org/manufacturer"""
  manufacturer: String

  """http://schema.org/provider"""
  provider: String

  """http://schema.org/isRelatedTo"""
  isRelatedTo: String

  """http://schema.org/children"""
  children: String

  """http://schema.org/parent"""
  parent: String

  """http://schema.org/birthPlace"""
  birthPlace: String

  """http://schema.org/birthDate"""
  birthDate: String

  """http://schema.org/author"""
  author: String

  """http://schema.org/locationCreated"""
  locationCreated: String

  """http://schema.org/about"""
  about: String

  """http://schema.org/subjectOf"""
  subjectOf: String

  """http://schema.org/position"""
  position: String

  """http://schema.org/offeredBy"""
  offeredBy: String

  """http://schema.org/makesOffer"""
  makesOffer: String

  """http://schema.org/areaServed"""
  areaServed: String

  """http://schema.org/addOn"""
  addOn: String

  """http://schema.org/itemOffered"""
  itemOffered: String

  """http://schema.org/price"""
  price: String

  """http://schema.org/priceValidUntil"""
  priceValidUntil: String

  """http://schema.org/offers"""
  offers: String
}

enum _Country_v_Text_ {
  Country
  Text
}

enum _CreativeWork_ {
  CreativeWork
}

"""All datatypes in the schema."""
enum _DATATYPES {
  Date
  Integer
  Number
  Text
}

enum _Date_ {
  Date
}

enum _Integer_v_Text_ {
  Integer
  Text
}

enum _Number_v_Text_ {
  Number
  Text
}

"""Any object in the database."""
type _OBJECT {
  """The URI identfier of the object."""
  _id(
    """The URI must be on the provided list of URIs."""
    only: [String]
  ): ID!

  """Types of the object."""
  _type(
    """Include inferred types for this object."""
    inferred: Boolean = false
  ): [String]
}

"""All object types in the schema."""
enum _OBJECT_TYPES {
  Country
  CreativeWork
  Offer
  Organization
  Person
  Place
  PostalAddress
  Product
  Service
  Thing
}

enum _Offer_ {
  Offer
}

enum _Organization_ {
  Organization
}

enum _Organization_v_Person_ {
  Organization
  Person
}

enum _Person_ {
  Person
}

enum _Place_ {
  Place
}

enum _Place_v_Text_ {
  Place
  Text
}

enum _PostalAddress_v_Text_ {
  PostalAddress
  Text
}

enum _Product_v_Service_ {
  Product
  Service
}

enum _Text_ {
  Text
}

enum _Thing_ {
  Thing
}

"""The filler for the property about"""
input about_INPUT {
  """The type of the property filler."""
  _type: _Thing_

  """The URI identfier of the object."""
  _id: ID!
}

"""The filler for the property addOn"""
input addOn_INPUT {
  """The type of the property filler."""
  _type: _Offer_

  """The URI identfier of the object."""
  _id: ID!
}

"""The filler for the property address"""
input address_INPUT {
  """The type of the property filler."""
  _type: _PostalAddress_v_Text_

  """The URI identfier of the object."""
  _id: ID

  """The literal data value of the property."""
  _value: String
}

"""The filler for the property addressCountry"""
input addressCountry_INPUT {
  """The type of the property filler."""
  _type: _Country_v_Text_

  """The URI identfier of the object."""
  _id: ID

  """The literal data value of the property."""
  _value: String
}

"""The filler for the property areaServed"""
input areaServed_INPUT {
  """The type of the property filler."""
  _type: _Place_v_Text_

  """The URI identfier of the object."""
  _id: ID

  """The literal data value of the property."""
  _value: String
}

"""The filler for the property author"""
input author_INPUT {
  """The type of the property filler."""
  _type: _Organization_v_Person_

  """The URI identfier of the object."""
  _id: ID!
}

"""The filler for the property birthDate"""
input birthDate_INPUT {
  """The type of the property filler."""
  _type: _Date_

  """The literal data value of the property."""
  _value: String!
}

"""The filler for the property birthPlace"""
input birthPlace_INPUT {
  """The type of the property filler."""
  _type: _Place_

  """The URI identfier of the object."""
  _id: ID!
}

"""The filler for the property children"""
input children_INPUT {
  """The type of the property filler."""
  _type: _Person_

  """The URI identfier of the object."""
  _id: ID!
}

"""
A country.

Broader types: Place, Thing
"""
type Country {
  """The name of an entity."""
  name: Text

  """Physical address of the item."""
  address: [PostalAddress_v_Text]

  """A CreativeWork or Event about this Thing."""
  subjectOf: [CreativeWork]

  """The URI identfier of the object."""
  _id(
    """The URI must be on the provided list of URIs."""
    only: [String]
  ): ID!

  """Types of the object."""
  _type(
    """Include inferred types for this object."""
    inferred: Boolean = false
  ): [String]

  """The inverse view of the object of type: Country."""
  _reverse: Country_REV
}

"""
A country.

Broader types: Place, Thing
"""
input Country_INPUT {
  """The name of an entity."""
  name: name_INPUT

  """Physical address of the item."""
  address: [address_INPUT]

  """A CreativeWork or Event about this Thing."""
  subjectOf: [subjectOf_INPUT]

  """The URI identfier of the object."""
  _id: ID!

  """Types of the object."""
  _type: [_OBJECT_TYPES]
}

"""
This is the inverse view of the object of type: Country. 

 This means, that whenever the schema contains the structure SomeType {
someField: Country } it will also be the case that Country_REV{ someField: SomeType }.
"""
type Country_REV {
  """
  This is the inverse view of the property: addressCountry. 
  
  This means that whenever it is the case that { x { addressCountry { y } } it
  implies { y { _reverse { addressCountry { x } } }.
  """
  addressCountry: [PostalAddress]

  """
  This is the inverse view of the property: birthPlace. 
  
  This means that whenever it is the case that { x { birthPlace { y } } it implies { y { _reverse { birthPlace { x } } }.
  """
  birthPlace: [Person]

  """
  This is the inverse view of the property: locationCreated. 
  
  This means that whenever it is the case that { x { locationCreated { y } } it
  implies { y { _reverse { locationCreated { x } } }.
  """
  locationCreated: [CreativeWork]

  """
  This is the inverse view of the property: about. 
  
  This means that whenever it is the case that { x { about { y } } it implies { y { _reverse { about { x } } }.
  """
  about: [CreativeWork]

  """
  This is the inverse view of the property: areaServed. 
  
  This means that whenever it is the case that { x { areaServed { y } } it implies { y { _reverse { areaServed { x } } }.
  """
  areaServed: [Offer_v_Organization_v_Service]
}

"""A filler of any of the types: Country, Text."""
union Country_v_Text = Country | Text

"""
The most generic kind of creative work, including books, movies, photographs, software programs, etc.

Broader types: Thing
"""
type CreativeWork {
  """The name of an entity."""
  name: Text

  """
  The author of this content or rating. Please note that author is special in
  that HTML 5 provides a special mechanism for indicating authorship via the rel
  tag. That is equivalent to this and may be used interchangeably.
  """
  author: [Organization_v_Person]

  """
  The location where the CreativeWork was created, which may not be the same as the location depicted in the CreativeWork.
  """
  locationCreated: [Place]

  """The subject matter of the content."""
  about: [Thing]

  """A CreativeWork or Event about this Thing."""
  subjectOf: [CreativeWork]

  """The position of an item in a series or sequence of items."""
  position: [Integer_v_Text]

  """
  An offer to provide this item&#x2014;for example, an offer to sell a product,
  rent the DVD of a movie, perform a service, or give away tickets to an event.
  """
  offers: [Offer]

  """The URI identfier of the object."""
  _id(
    """The URI must be on the provided list of URIs."""
    only: [String]
  ): ID!

  """Types of the object."""
  _type(
    """Include inferred types for this object."""
    inferred: Boolean = false
  ): [String]

  """The inverse view of the object of type: CreativeWork."""
  _reverse: CreativeWork_REV
}

"""
The most generic kind of creative work, including books, movies, photographs, software programs, etc.

Broader types: Thing
"""
input CreativeWork_INPUT {
  """The name of an entity."""
  name: name_INPUT

  """
  The author of this content or rating. Please note that author is special in
  that HTML 5 provides a special mechanism for indicating authorship via the rel
  tag. That is equivalent to this and may be used interchangeably.
  """
  author: [author_INPUT]

  """
  The location where the CreativeWork was created, which may not be the same as the location depicted in the CreativeWork.
  """
  locationCreated: [locationCreated_INPUT]

  """The subject matter of the content."""
  about: [about_INPUT]

  """A CreativeWork or Event about this Thing."""
  subjectOf: [subjectOf_INPUT]

  """The position of an item in a series or sequence of items."""
  position: [position_INPUT]

  """
  An offer to provide this item&#x2014;for example, an offer to sell a product,
  rent the DVD of a movie, perform a service, or give away tickets to an event.
  """
  offers: [offers_INPUT]

  """The URI identfier of the object."""
  _id: ID!

  """Types of the object."""
  _type: [_OBJECT_TYPES]
}

"""
This is the inverse view of the object of type: CreativeWork. 

 This means, that whenever the schema contains the structure SomeType {
someField: CreativeWork } it will also be the case that CreativeWork_REV{
someField: SomeType }.
"""
type CreativeWork_REV {
  """
  This is the inverse view of the property: about. 
  
  This means that whenever it is the case that { x { about { y } } it implies { y { _reverse { about { x } } }.
  """
  about: [CreativeWork]

  """
  This is the inverse view of the property: subjectOf. 
  
  This means that whenever it is the case that { x { subjectOf { y } } it implies { y { _reverse { subjectOf { x } } }.
  """
  subjectOf: [Thing]
}

"""A filler of any of the types: CreativeWork, Product, Service."""
union CreativeWork_v_Product_v_Service = CreativeWork | Product | Service

"""A date value in ISO 8601 date format."""
type Date {
  """The literal data value for the property."""
  _value(
    """The value of this property must be on the provided list."""
    only: [String]

    """The value of the property must contain the specified string."""
    contains: String

    """The language of the string value (if recognized)."""
    lang: String
  ): String

  """Asserted data type of this value."""
  _type: [String]
}

"""The filler for the property employee"""
input employee_INPUT {
  """The type of the property filler."""
  _type: _Person_

  """The URI identfier of the object."""
  _id: ID!
}

"""The filler for the property funder"""
input funder_INPUT {
  """The type of the property filler."""
  _type: _Organization_v_Person_

  """The URI identfier of the object."""
  _id: ID!
}

"""
This is integer DataType.

Broader types: Number
"""
type Integer {
  """The literal data value for the property."""
  _value(
    """The value of this property must be on the provided list."""
    only: [String]

    """The value of the property must contain the specified string."""
    contains: String

    """The language of the string value (if recognized)."""
    lang: String
  ): String

  """Asserted data type of this value."""
  _type: [String]
}

"""A filler of any of the types: Integer, Text."""
union Integer_v_Text = Integer | Text

"""The filler for the property isRelatedTo"""
input isRelatedTo_INPUT {
  """The type of the property filler."""
  _type: _Product_v_Service_

  """The URI identfier of the object."""
  _id: ID!
}

"""The filler for the property itemOffered"""
input itemOffered_INPUT {
  """The type of the property filler."""
  _type: _Product_v_Service_

  """The URI identfier of the object."""
  _id: ID!
}

"""The filler for the property legalName"""
input legalName_INPUT {
  """The type of the property filler."""
  _type: _Text_

  """The literal data value of the property."""
  _value: String!
}

"""The filler for the property locationCreated"""
input locationCreated_INPUT {
  """The type of the property filler."""
  _type: _Place_

  """The URI identfier of the object."""
  _id: ID!
}

"""The filler for the property makesOffer"""
input makesOffer_INPUT {
  """The type of the property filler."""
  _type: _Offer_

  """The URI identfier of the object."""
  _id: ID!
}

"""The filler for the property manufacturer"""
input manufacturer_INPUT {
  """The type of the property filler."""
  _type: _Organization_

  """The URI identfier of the object."""
  _id: ID!
}

"""CRUD operations over objects of specifc types."""
type Mutation {
  """Creates a new object with the provided ID."""
  CREATE(
    """A valid, new URI for the created object."""
    id: ID!
  ): Boolean

  """
  Deletes an existing object by the provided ID (including all data about it).
  """
  DELETE(
    """A valid URI of an existing object"""
    id: ID!
  ): Boolean

  """Perform mutation over an object of type: Thing."""
  Thing(
    """The type of the mutation to be applied."""
    type: MutationType!

    """
    Throw error (instead of a warning) in case the object does not exist prior to the mutation.
    """
    ensureExists: Boolean

    """The input object of the mutation."""
    input: Thing_INPUT!
  ): Boolean

  """Perform mutation over an object of type: Organization."""
  Organization(
    """The type of the mutation to be applied."""
    type: MutationType!

    """
    Throw error (instead of a warning) in case the object does not exist prior to the mutation.
    """
    ensureExists: Boolean

    """The input object of the mutation."""
    input: Organization_INPUT!
  ): Boolean

  """Perform mutation over an object of type: Person."""
  Person(
    """The type of the mutation to be applied."""
    type: MutationType!

    """
    Throw error (instead of a warning) in case the object does not exist prior to the mutation.
    """
    ensureExists: Boolean

    """The input object of the mutation."""
    input: Person_INPUT!
  ): Boolean

  """Perform mutation over an object of type: Country."""
  Country(
    """The type of the mutation to be applied."""
    type: MutationType!

    """
    Throw error (instead of a warning) in case the object does not exist prior to the mutation.
    """
    ensureExists: Boolean

    """The input object of the mutation."""
    input: Country_INPUT!
  ): Boolean

  """Perform mutation over an object of type: Place."""
  Place(
    """The type of the mutation to be applied."""
    type: MutationType!

    """
    Throw error (instead of a warning) in case the object does not exist prior to the mutation.
    """
    ensureExists: Boolean

    """The input object of the mutation."""
    input: Place_INPUT!
  ): Boolean

  """Perform mutation over an object of type: PostalAddress."""
  PostalAddress(
    """The type of the mutation to be applied."""
    type: MutationType!

    """
    Throw error (instead of a warning) in case the object does not exist prior to the mutation.
    """
    ensureExists: Boolean

    """The input object of the mutation."""
    input: PostalAddress_INPUT!
  ): Boolean

  """Perform mutation over an object of type: Product."""
  Product(
    """The type of the mutation to be applied."""
    type: MutationType!

    """
    Throw error (instead of a warning) in case the object does not exist prior to the mutation.
    """
    ensureExists: Boolean

    """The input object of the mutation."""
    input: Product_INPUT!
  ): Boolean

  """Perform mutation over an object of type: Service."""
  Service(
    """The type of the mutation to be applied."""
    type: MutationType!

    """
    Throw error (instead of a warning) in case the object does not exist prior to the mutation.
    """
    ensureExists: Boolean

    """The input object of the mutation."""
    input: Service_INPUT!
  ): Boolean

  """Perform mutation over an object of type: CreativeWork."""
  CreativeWork(
    """The type of the mutation to be applied."""
    type: MutationType!

    """
    Throw error (instead of a warning) in case the object does not exist prior to the mutation.
    """
    ensureExists: Boolean

    """The input object of the mutation."""
    input: CreativeWork_INPUT!
  ): Boolean

  """Perform mutation over an object of type: Offer."""
  Offer(
    """The type of the mutation to be applied."""
    type: MutationType!

    """
    Throw error (instead of a warning) in case the object does not exist prior to the mutation.
    """
    ensureExists: Boolean

    """The input object of the mutation."""
    input: Offer_INPUT!
  ): Boolean
}

enum MutationType {
  """
  Add specified data about an object, provided the object exists and the data is consistent with the current knowledge base.
  """
  INSERT

  """Remove all specified data from the current knowledge base."""
  REMOVE

  """
  Replace the existing object with its new version specified in the input.
  """
  UPDATE
}

"""The filler for the property name"""
input name_INPUT {
  """The type of the property filler."""
  _type: _Text_

  """The literal data value of the property."""
  _value: String!
}

"""This is number DataType."""
type Number {
  """The literal data value for the property."""
  _value(
    """The value of this property must be on the provided list."""
    only: [String]

    """The value of the property must contain the specified string."""
    contains: String

    """The language of the string value (if recognized)."""
    lang: String
  ): String

  """Asserted data type of this value."""
  _type: [String]
}

"""A filler of any of the types: Number, Text."""
union Number_v_Text = Number | Text

"""
An offer to transfer some rights to an item or to provide a service — for
example, an offer to sell tickets to an event, to rent the DVD of a movie, to
stream a TV show over the internet, to repair a motorcycle, or to loan a book.

Broader types: Thing
"""
type Offer {
  """The name of an entity."""
  name: Text

  """A CreativeWork or Event about this Thing."""
  subjectOf: [CreativeWork]

  """A pointer to the organization or person making the offer."""
  offeredBy: [Organization_v_Person]

  """The geographic area where a service or offered item is provided."""
  areaServed: [Place_v_Text]

  """
  An additional offer that can only be obtained in combination with the first
  base offer (e.g. supplements and extensions that are available for a surcharge).
  """
  addOn: [Offer]

  """The item being offered."""
  itemOffered: [Product_v_Service]

  """
  The offer price of a product, or of a price component when attached to PriceSpecification and its subtypes.
  """
  price: Number_v_Text

  """The date after which the price is no longer available."""
  priceValidUntil: Date

  """The URI identfier of the object."""
  _id(
    """The URI must be on the provided list of URIs."""
    only: [String]
  ): ID!

  """Types of the object."""
  _type(
    """Include inferred types for this object."""
    inferred: Boolean = false
  ): [String]

  """The inverse view of the object of type: Offer."""
  _reverse: Offer_REV
}

"""
An offer to transfer some rights to an item or to provide a service — for
example, an offer to sell tickets to an event, to rent the DVD of a movie, to
stream a TV show over the internet, to repair a motorcycle, or to loan a book.

Broader types: Thing
"""
input Offer_INPUT {
  """The name of an entity."""
  name: name_INPUT

  """A CreativeWork or Event about this Thing."""
  subjectOf: [subjectOf_INPUT]

  """A pointer to the organization or person making the offer."""
  offeredBy: [offeredBy_INPUT]

  """The geographic area where a service or offered item is provided."""
  areaServed: [areaServed_INPUT]

  """
  An additional offer that can only be obtained in combination with the first
  base offer (e.g. supplements and extensions that are available for a surcharge).
  """
  addOn: [addOn_INPUT]

  """The item being offered."""
  itemOffered: [itemOffered_INPUT]

  """
  The offer price of a product, or of a price component when attached to PriceSpecification and its subtypes.
  """
  price: price_INPUT

  """The date after which the price is no longer available."""
  priceValidUntil: priceValidUntil_INPUT

  """The URI identfier of the object."""
  _id: ID!

  """Types of the object."""
  _type: [_OBJECT_TYPES]
}

"""
This is the inverse view of the object of type: Offer. 

 This means, that whenever the schema contains the structure SomeType {
someField: Offer } it will also be the case that Offer_REV{ someField: SomeType }.
"""
type Offer_REV {
  """
  This is the inverse view of the property: about. 
  
  This means that whenever it is the case that { x { about { y } } it implies { y { _reverse { about { x } } }.
  """
  about: [CreativeWork]

  """
  This is the inverse view of the property: makesOffer. 
  
  This means that whenever it is the case that { x { makesOffer { y } } it implies { y { _reverse { makesOffer { x } } }.
  """
  makesOffer: [Organization_v_Person]

  """
  This is the inverse view of the property: addOn. 
  
  This means that whenever it is the case that { x { addOn { y } } it implies { y { _reverse { addOn { x } } }.
  """
  addOn: [Offer]

  """
  This is the inverse view of the property: offers. 
  
  This means that whenever it is the case that { x { offers { y } } it implies { y { _reverse { offers { x } } }.
  """
  offers: [CreativeWork_v_Product_v_Service]
}

"""A filler of any of the types: Offer, Organization, Service."""
union Offer_v_Organization_v_Service = Offer | Organization | Service

"""The filler for the property offeredBy"""
input offeredBy_INPUT {
  """The type of the property filler."""
  _type: _Organization_v_Person_

  """The URI identfier of the object."""
  _id: ID!
}

"""The filler for the property offers"""
input offers_INPUT {
  """The type of the property filler."""
  _type: _Offer_

  """The URI identfier of the object."""
  _id: ID!
}

"""
An organization such as a school, NGO, corporation, club, etc.

Broader types: Thing
"""
type Organization {
  """An employee of an organization."""
  employee: [Person]

  """The name of an entity."""
  name: Text

  """
  The official name of the organization, e.g. the registered company name.
  """
  legalName: Text

  """
  A person or organization that supports (sponsors) something through some kind of financial contribution.
  """
  funder: [Organization_v_Person]

  """Physical address of the item."""
  address: [PostalAddress_v_Text]

  """A CreativeWork or Event about this Thing."""
  subjectOf: [CreativeWork]

  """
  A pointer to products or services offered by the organization or person.
  """
  makesOffer: [Offer]

  """The geographic area where a service or offered item is provided."""
  areaServed: [Place_v_Text]

  """The URI identfier of the object."""
  _id(
    """The URI must be on the provided list of URIs."""
    only: [String]
  ): ID!

  """Types of the object."""
  _type(
    """Include inferred types for this object."""
    inferred: Boolean = false
  ): [String]

  """The inverse view of the object of type: Organization."""
  _reverse: Organization_REV
}

"""
An organization such as a school, NGO, corporation, club, etc.

Broader types: Thing
"""
input Organization_INPUT {
  """An employee of an organization."""
  employee: [employee_INPUT]

  """The name of an entity."""
  name: name_INPUT

  """
  The official name of the organization, e.g. the registered company name.
  """
  legalName: legalName_INPUT

  """
  A person or organization that supports (sponsors) something through some kind of financial contribution.
  """
  funder: [funder_INPUT]

  """Physical address of the item."""
  address: [address_INPUT]

  """A CreativeWork or Event about this Thing."""
  subjectOf: [subjectOf_INPUT]

  """
  A pointer to products or services offered by the organization or person.
  """
  makesOffer: [makesOffer_INPUT]

  """The geographic area where a service or offered item is provided."""
  areaServed: [areaServed_INPUT]

  """The URI identfier of the object."""
  _id: ID!

  """Types of the object."""
  _type: [_OBJECT_TYPES]
}

"""
This is the inverse view of the object of type: Organization. 

 This means, that whenever the schema contains the structure SomeType {
someField: Organization } it will also be the case that Organization_REV{
someField: SomeType }.
"""
type Organization_REV {
  """
  This is the inverse view of the property: worksFor. 
  
  This means that whenever it is the case that { x { worksFor { y } } it implies { y { _reverse { worksFor { x } } }.
  """
  worksFor: [Person]

  """
  This is the inverse view of the property: funder. 
  
  This means that whenever it is the case that { x { funder { y } } it implies { y { _reverse { funder { x } } }.
  """
  funder: [Organization_v_Person]

  """
  This is the inverse view of the property: manufacturer. 
  
  This means that whenever it is the case that { x { manufacturer { y } } it
  implies { y { _reverse { manufacturer { x } } }.
  """
  manufacturer: [Product]

  """
  This is the inverse view of the property: provider. 
  
  This means that whenever it is the case that { x { provider { y } } it implies { y { _reverse { provider { x } } }.
  """
  provider: [Service]

  """
  This is the inverse view of the property: author. 
  
  This means that whenever it is the case that { x { author { y } } it implies { y { _reverse { author { x } } }.
  """
  author: [CreativeWork]

  """
  This is the inverse view of the property: about. 
  
  This means that whenever it is the case that { x { about { y } } it implies { y { _reverse { about { x } } }.
  """
  about: [CreativeWork]

  """
  This is the inverse view of the property: offeredBy. 
  
  This means that whenever it is the case that { x { offeredBy { y } } it implies { y { _reverse { offeredBy { x } } }.
  """
  offeredBy: [Offer]
}

"""A filler of any of the types: Organization, Person."""
union Organization_v_Person = Organization | Person

"""A filler of any of the types: Organization, Person, Place."""
union Organization_v_Person_v_Place = Organization | Person | Place

"""The filler for the property parent"""
input parent_INPUT {
  """The type of the property filler."""
  _type: _Person_

  """The URI identfier of the object."""
  _id: ID!
}

"""
A person

Broader types: Thing
"""
type Person {
  """Organizations that the person works for."""
  worksFor: [Organization]

  """The name of an entity."""
  name: Text

  """
  A person or organization that supports (sponsors) something through some kind of financial contribution.
  """
  funder: [Organization_v_Person]

  """Physical address of the item."""
  address: [PostalAddress_v_Text]

  """A child of the person."""
  children: [Person]

  """A parent of this person."""
  parent: [Person]

  """The place where the person was born."""
  birthPlace: [Place]

  """Date of birth."""
  birthDate: [Date]

  """A CreativeWork or Event about this Thing."""
  subjectOf: [CreativeWork]

  """
  A pointer to products or services offered by the organization or person.
  """
  makesOffer: [Offer]

  """The URI identfier of the object."""
  _id(
    """The URI must be on the provided list of URIs."""
    only: [String]
  ): ID!

  """Types of the object."""
  _type(
    """Include inferred types for this object."""
    inferred: Boolean = false
  ): [String]

  """The inverse view of the object of type: Person."""
  _reverse: Person_REV
}

"""
A person

Broader types: Thing
"""
input Person_INPUT {
  """Organizations that the person works for."""
  worksFor: [worksFor_INPUT]

  """The name of an entity."""
  name: name_INPUT

  """
  A person or organization that supports (sponsors) something through some kind of financial contribution.
  """
  funder: [funder_INPUT]

  """Physical address of the item."""
  address: [address_INPUT]

  """A child of the person."""
  children: [children_INPUT]

  """A parent of this person."""
  parent: [parent_INPUT]

  """The place where the person was born."""
  birthPlace: [birthPlace_INPUT]

  """Date of birth."""
  birthDate: [birthDate_INPUT]

  """A CreativeWork or Event about this Thing."""
  subjectOf: [subjectOf_INPUT]

  """
  A pointer to products or services offered by the organization or person.
  """
  makesOffer: [makesOffer_INPUT]

  """The URI identfier of the object."""
  _id: ID!

  """Types of the object."""
  _type: [_OBJECT_TYPES]
}

"""
This is the inverse view of the object of type: Person. 

 This means, that whenever the schema contains the structure SomeType {
someField: Person } it will also be the case that Person_REV{ someField: SomeType }.
"""
type Person_REV {
  """
  This is the inverse view of the property: employee. 
  
  This means that whenever it is the case that { x { employee { y } } it implies { y { _reverse { employee { x } } }.
  """
  employee: [Organization]

  """
  This is the inverse view of the property: funder. 
  
  This means that whenever it is the case that { x { funder { y } } it implies { y { _reverse { funder { x } } }.
  """
  funder: [Organization_v_Person]

  """
  This is the inverse view of the property: provider. 
  
  This means that whenever it is the case that { x { provider { y } } it implies { y { _reverse { provider { x } } }.
  """
  provider: [Service]

  """An employee of an organization."""
  employee(
    """Include inferred types for this project."""
    filter: Filter
  ): [Person]

  """
  This is the inverse view of the property: parent. 
  
  This means that whenever it is the case that { x { parent { y } } it implies { y { _reverse { parent { x } } }.
  """
  parent: [Person]

  """
  This is the inverse view of the property: author. 
  
  This means that whenever it is the case that { x { author { y } } it implies { y { _reverse { author { x } } }.
  """
  author: [CreativeWork]

  """
  This is the inverse view of the property: about. 
  
  This means that whenever it is the case that { x { about { y } } it implies { y { _reverse { about { x } } }.
  """
  about: [CreativeWork]

  """The URI identfier of the object."""
  _id(
    """The URI must be on the provided list of URIs."""
    only: [String]
  ): ID!

  """Types of the object."""
  _type(
    """Include inferred types for this object."""
    inferred: Boolean = false
  ): [String]

  """The inverse view of the object of type: Place."""
  _reverse: Place_REV
}

"""
Entities that have a somewhat fixed, physical extension.

Broader types: Thing
"""
input Place_INPUT {
  """The name of an entity."""
  name: name_INPUT

  """Physical address of the item."""
  address: [address_INPUT]

  """A CreativeWork or Event about this Thing."""
  subjectOf: [subjectOf_INPUT]

  """The URI identfier of the object."""
  _id: ID!

  """Types of the object."""
  _type: [_OBJECT_TYPES]
}

"""
This is the inverse view of the object of type: Place. 

 This means, that whenever the schema contains the structure SomeType {
someField: Place } it will also be the case that Place_REV{ someField: SomeType }.
"""
type Place_REV {
  """
  This is the inverse view of the property: birthPlace. 
  
  This means that whenever it is the case that { x { birthPlace { y } } it implies { y { _reverse { birthPlace { x } } }.
  """
  birthPlace: [Person]

  """
  This is the inverse view of the property: locationCreated. 
  
  This means that whenever it is the case that { x { locationCreated { y } } it
  implies { y { _reverse { locationCreated { x } } }.
  """
  locationCreated: [CreativeWork]

  """
  This is the inverse view of the property: about. 
  
  This means that whenever it is the case that { x { about { y } } it implies { y { _reverse { about { x } } }.
  """
  about: [CreativeWork]

  """
  This is the inverse view of the property: areaServed. 
  
  This means that whenever it is the case that { x { areaServed { y } } it implies { y { _reverse { areaServed { x } } }.
  """
  areaServed: [Offer_v_Organization_v_Service]
}

"""A filler of any of the types: Place, Text."""
union Place_v_Text = Place | Text

"""The filler for the property position"""
input position_INPUT {
  """The type of the property filler."""
  _type: _Integer_v_Text_

  """The literal data value of the property."""
  _value: String!
}

"""
The mailing address.

Broader types: Thing
"""
type PostalAddress {
  """The name of an entity."""
  name: Text

  """
  The country. For example, USA. You can also provide the two-letter ISO 3166-1 alpha-2 country code.
  """
  addressCountry: [Country_v_Text]

  """A CreativeWork or Event about this Thing."""
  subjectOf: [CreativeWork]

  """The URI identfier of the object."""
  _id(
    """The URI must be on the provided list of URIs."""
    only: [String]
  ): ID!

  """Types of the object."""
  _type(
    """Include inferred types for this object."""
    inferred: Boolean = false
  ): [String]

  """The inverse view of the object of type: PostalAddress."""
  _reverse: PostalAddress_REV
}

"""
The mailing address.

Broader types: Thing
"""
input PostalAddress_INPUT {
  """The name of an entity."""
  name: name_INPUT

  """
  The country. For example, USA. You can also provide the two-letter ISO 3166-1 alpha-2 country code.
  """
  addressCountry: [addressCountry_INPUT]

  """A CreativeWork or Event about this Thing."""
  subjectOf: [subjectOf_INPUT]

  """The URI identfier of the object."""
  _id: ID!

  """Types of the object."""
  _type: [_OBJECT_TYPES]
}

"""
This is the inverse view of the object of type: PostalAddress. 

 This means, that whenever the schema contains the structure SomeType {
someField: PostalAddress } it will also be the case that PostalAddress_REV{
someField: SomeType }.
"""
type PostalAddress_REV {
  """
  This is the inverse view of the property: address. 
  
  This means that whenever it is the case that { x { address { y } } it implies { y { _reverse { address { x } } }.
  """
  address: [Organization_v_Person_v_Place]

  """
  This is the inverse view of the property: about. 
  
  This means that whenever it is the case that { x { about { y } } it implies { y { _reverse { about { x } } }.
  """
  about: [CreativeWork]
}

"""A filler of any of the types: PostalAddress, Text."""
union PostalAddress_v_Text = PostalAddress | Text

"""The filler for the property price"""
input price_INPUT {
  """The type of the property filler."""
  _type: _Number_v_Text_

  """The literal data value of the property."""
  _value: String!
}

"""The filler for the property priceValidUntil"""
input priceValidUntil_INPUT {
  """The type of the property filler."""
  _type: _Date_

  """The literal data value of the property."""
  _value: String!
}

"""
Any offered product or service. For example: a pair of shoes; a concert ticket;
the rental of a car; a haircut; or an episode of a TV show streamed online.

Broader types: Thing
"""
type Person {
  """Is a shareholder of an organization."""
  shareholderOf: [Organization]

  """Affiliation of a person."""
  affiliation(
    """Include inferred types for this project."""
    filter: Filter
  ): [Organization]

  """The name of an entity."""
  name: Text

  """The manufacturer of the product."""
  manufacturer: [Organization]

  """A pointer to another, somehow related product (or multiple products)."""
  isRelatedTo: [Product_v_Service]

  """A CreativeWork or Event about this Thing."""
  subjectOf: [CreativeWork]

  """
  An offer to provide this item&#x2014;for example, an offer to sell a product,
  rent the DVD of a movie, perform a service, or give away tickets to an event.
  """
  offers: [Offer]

  """The URI identfier of the object."""
  _id(
    """The URI must be on the provided list of URIs."""
    only: [String]
  ): ID!

  """Types of the object."""
  _type(
    """Include inferred types for this object."""
    inferred: Boolean = false
  ): [String]

  """The inverse view of the object of type: Product."""
  _reverse: Product_REV
}

"""
Any offered product or service. For example: a pair of shoes; a concert ticket;
the rental of a car; a haircut; or an episode of a TV show streamed online.

Broader types: Thing
"""
input Product_INPUT {
  """The name of an entity."""
  name: name_INPUT

  """The manufacturer of the product."""
  manufacturer: [manufacturer_INPUT]

  """A pointer to another, somehow related product (or multiple products)."""
  isRelatedTo: [isRelatedTo_INPUT]

  """A CreativeWork or Event about this Thing."""
  subjectOf: [subjectOf_INPUT]

  """
  An offer to provide this item&#x2014;for example, an offer to sell a product,
  rent the DVD of a movie, perform a service, or give away tickets to an event.
  """
  offers: [offers_INPUT]

  """The URI identfier of the object."""
  _id: ID!

  """Types of the object."""
  _type: [_OBJECT_TYPES]
}

"""
This is the inverse view of the object of type: Product. 

 This means, that whenever the schema contains the structure SomeType {
someField: Product } it will also be the case that Product_REV{ someField: SomeType }.
"""
type Product_REV {
  """
  This is the inverse view of the property: isRelatedTo. 
  
  This means that whenever it is the case that { x { isRelatedTo { y } } it implies { y { _reverse { isRelatedTo { x } } }.
  """
  isRelatedTo: [Product_v_Service]

  """
  This is the inverse view of the property: about. 
  
  This means that whenever it is the case that { x { about { y } } it implies { y { _reverse { about { x } } }.
  """
  about: [CreativeWork]

  """
  This is the inverse view of the property: itemOffered. 
  
  This means that whenever it is the case that { x { itemOffered { y } } it implies { y { _reverse { itemOffered { x } } }.
  """
  itemOffered: [Offer]
}

"""A filler of any of the types: Product, Service."""
union Product_v_Service = Product | Service

"""The filler for the property provider"""
input provider_INPUT {
  """The type of the property filler."""
  _type: _Organization_v_Person_

  """The URI identfier of the object."""
  _id: ID!
}

"""Get objects of specific types."""
type Query {
  """
  The mapping from types and properties of the GraphQL schema to the corresponding URIs of the structured data schema.
  """
  _CONTEXT: _CONTEXT

  """List all objects in the database."""
  _OBJECT(
    """
    The number of the consecutive results page to be returned by the query.
    """
    page: Int = 1
    filter: Filter
  ): [_OBJECT]

  """List objects of type: Thing."""
  Thing(
    """
    The number of the consecutive results page to be returned by the query.
    """
    page: Int = 1
    filter: Filter

    """Include inferred objects of this type."""
    inferred: Boolean = false
  ): [Thing]

  """List objects of type: Organization."""
  Organization(
    """
    The number of the consecutive results page to be returned by the query.
    """
    page: Int = 1
    filter: Filter

    """Include inferred objects of this type."""
    inferred: Boolean = false
  ): [Organization]

  """List objects of type: Person."""
  Person(
    """
    The number of the consecutive results page to be returned by the query.
    """
    page: Int = 1
    filter: Filter

    """Include inferred objects of this type."""
    inferred: Boolean = false
  ): [Person]

  """List objects of type: Country."""
  Country(
    """
    The number of the consecutive results page to be returned by the query.
    """
    page: Int = 1

    """Include inferred objects of this type."""
    inferred: Boolean = false
  ): [Country]

  """List objects of type: Place."""
  Place(
    """
    The number of the consecutive results page to be returned by the query.
    """
    page: Int = 1

    """Include inferred objects of this type."""
    inferred: Boolean = false
  ): [Place]

  """List objects of type: PostalAddress."""
  PostalAddress(
    """
    The number of the consecutive results page to be returned by the query.
    """
    page: Int = 1

    """Include inferred objects of this type."""
    inferred: Boolean = false
  ): [PostalAddress]

  """List objects of type: Product."""
  Product(
    """
    The number of the consecutive results page to be returned by the query.
    """
    page: Int = 1

    """Include inferred objects of this type."""
    inferred: Boolean = false
  ): [Product]

  """List objects of type: Service."""
  Service(
    """
    The number of the consecutive results page to be returned by the query.
    """
    page: Int = 1

    """Include inferred objects of this type."""
    inferred: Boolean = false
  ): [Service]

  """List objects of type: CreativeWork."""
  CreativeWork(
    """
    The number of the consecutive results page to be returned by the query.
    """
    page: Int = 1

    """Include inferred objects of this type."""
    inferred: Boolean = false
  ): [CreativeWork]

  """List objects of type: Offer."""
  Offer(
    """
    The number of the consecutive results page to be returned by the query.
    """
    page: Int = 1
    filter: Filter

    """Include inferred objects of this type."""
    inferred: Boolean = false
  ): [Offer]
}

"""
A service provided by an organization, e.g. delivery service, print services, etc.

Broader types: Thing
"""
type Service {
  """The name of an entity."""
  name: Text

  """
  The service provider, service operator, or service performer; the goods
  producer. Another party (a seller) may offer those services or goods on behalf
  of the provider. A provider may also serve as the seller.
  """
  provider: [Organization_v_Person]

  """A pointer to another, somehow related product (or multiple products)."""
  isRelatedTo: [Product_v_Service]

  """A CreativeWork or Event about this Thing."""
  subjectOf: [CreativeWork]

  """The geographic area where a service or offered item is provided."""
  areaServed: [Place_v_Text]

  """
  An offer to provide this item&#x2014;for example, an offer to sell a product,
  rent the DVD of a movie, perform a service, or give away tickets to an event.
  """
  offers: [Offer]

  """The URI identfier of the object."""
  _id(
    """The URI must be on the provided list of URIs."""
    only: [String]
  ): ID!

  """Types of the object."""
  _type(
    """Include inferred types for this object."""
    inferred: Boolean = false
  ): [String]

  """The inverse view of the object of type: Service."""
  _reverse: Service_REV
}

"""
A service provided by an organization, e.g. delivery service, print services, etc.

Broader types: Thing
"""
input Service_INPUT {
  """The name of an entity."""
  name: name_INPUT

  """
  The service provider, service operator, or service performer; the goods
  producer. Another party (a seller) may offer those services or goods on behalf
  of the provider. A provider may also serve as the seller.
  """
  provider: [provider_INPUT]

  """A pointer to another, somehow related product (or multiple products)."""
  isRelatedTo: [isRelatedTo_INPUT]

  """A CreativeWork or Event about this Thing."""
  subjectOf: [subjectOf_INPUT]

  """The geographic area where a service or offered item is provided."""
  areaServed: [areaServed_INPUT]

  """
  An offer to provide this item&#x2014;for example, an offer to sell a product,
  rent the DVD of a movie, perform a service, or give away tickets to an event.
  """
  offers: [offers_INPUT]

  """The URI identfier of the object."""
  _id: ID!

  """Types of the object."""
  _type: [_OBJECT_TYPES]
}

"""
This is the inverse view of the object of type: Service. 

 This means, that whenever the schema contains the structure SomeType {
someField: Service } it will also be the case that Service_REV{ someField: SomeType }.
"""
type Service_REV {
  """
  This is the inverse view of the property: isRelatedTo. 
  
  This means that whenever it is the case that { x { isRelatedTo { y } } it implies { y { _reverse { isRelatedTo { x } } }.
  """
  isRelatedTo: [Product_v_Service]

  """
  This is the inverse view of the property: about. 
  
  This means that whenever it is the case that { x { about { y } } it implies { y { _reverse { about { x } } }.
  """
  about: [CreativeWork]

  """
  This is the inverse view of the property: itemOffered. 
  
  This means that whenever it is the case that { x { itemOffered { y } } it implies { y { _reverse { itemOffered { x } } }.
  """
  itemOffered: [Offer]
}

"""The filler for the property subjectOf"""
input subjectOf_INPUT {
  """The type of the property filler."""
  _type: _CreativeWork_

  """The URI identfier of the object."""
  _id: ID!
}

"""This is text DataType."""
type Text {
  """The literal data value for the property."""
  _value(
    """The value of this property must be on the provided list."""
    only: [String]

    """The value of the property must contain the specified string."""
    contains: String

    """The language of the string value (if recognized)."""
    lang: String
  ): String

  """Asserted data type of this value."""
  _type: [String]
}

"""Anything."""
type Thing {
  """The name of an entity."""
  name: Text

  """A CreativeWork or Event about this Thing."""
  subjectOf: [CreativeWork]

  """The URI identfier of the object."""
  _id(
    """The URI must be on the provided list of URIs."""
    only: [String]
  ): ID!

  """Types of the object."""
  _type(
    """Include inferred types for this object."""
    inferred: Boolean = false
  ): [String]

  """The inverse view of the object of type: Thing."""
  _reverse: Thing_REV
}

"""Anything."""
input Thing_INPUT {
  """The name of an entity."""
  name: name_INPUT

  """A CreativeWork or Event about this Thing."""
  subjectOf: [subjectOf_INPUT]

  """The URI identfier of the object."""
  _id: ID!

  """Types of the object."""
  _type: [_OBJECT_TYPES]
}

"""Filter."""
input Filter {
  """id"""
  _id: [ ID ]

  """http://schema.org/legalName"""
  legalName: [String]

  """http://schema.org/noOfEmployees"""
  noOfEmployees: [String] 

  """http://schema.org/name"""
  name: [String]
}

`

module.exports = schemaString
