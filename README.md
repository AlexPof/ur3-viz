# ur3-viz: Data mining and visualization of Ur III sumerian administrative texts

This is a small project to analyze and visualize on a large scale the transactional data from the corpus of Ur III administrative texts.

The 3rd dynasty of Ur is characterized by an abundant administrative documentation, giving insights about the organization of its society.
About 65,000 cuneiform tablets are known, which record various types of transactions.
![Ur 3 Tablet](ur3_tablet.jpg)
The texts of the tablets exhibit repeatable patterns, which makes it an interesting, though challenging, task for a data science project.

This project currently aims at identifying two-parties transactions, and building the corresponding transactional network.
In addition, since the year can often be identified in the texts, one obtains a time-varying graph. The current visualization approach gives control over the year, and
dynamically updates the graph as it is changed.

The most recent data visualization can be [accessed here](https://alexpof.github.io/ur3-viz/)

The current limitations of this project are as follows.

    * Only tablets for which the year is well identified are considered.
    * Transactions with more than one 'sender', or more than one 'receiver', are currently not considered
    * Intermediaries (identified by the sumerian keyword 'giri₃') are not considered
    * The type of goods described in the text is not automatically identified.
       However, the current visualization allows to search for specific sub-text in the raw tablets, and highlights the corresponding transactions.
    * Not all PNs, or other administrative functions, are properly identified. In particular, the description of PNs as 'son of' another PN (in sumerian, 'PN dumu PN') is
      not correctly implemented.

In addition to fixing the above limitations, the next steps may include deeper analyses of the time-varying transactional network.
