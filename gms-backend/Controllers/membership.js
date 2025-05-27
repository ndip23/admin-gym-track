const Membership = require('../Modals/membership');


exports.addMembership = async (req, res) => {
    try {
        const { months, price } = req.body;

        // Validate input data
        if (!months || !price) {
            return res.status(400).json({ error: "Months and price are required." });
        }

        const memberShip = await Membership.findOne({ gym: req.gym._id, months });
        if (memberShip) {
            memberShip.price = price;
            await memberShip.save();
            return res.status(200).json({ message: "Updated Successfully" });
        } else {
            const newMembership = new Membership({ price, months, gym: req.gym._id });
            await newMembership.save();
            return res.status(200).json({ message: "Added Successfully" });
        }
    } catch (err) {
        console.error("Server Error:", err); // Log the error on the server
        return res.status(500).json({ error: "Server Error" });
    }
};

exports.getMembership = async (req, res) => {
    try {
        const loggedInId = req.gym._id;
        const memberShip = await Membership.find({gym:loggedInId});
        res.status(200).json({ message: "Memberhip fetched Successfully", 
            memberShip : memberShip
        });
    } catch (err) {
        res.status(500).json({ error: "Server Error" });

    };
}



