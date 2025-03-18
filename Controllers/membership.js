const Membership = require('../Modals/membership');

exports.addMembership = async (req, res) => {
    try {
        const { months, price } = req.body;

        // Corrected the query to find the membership by gym and months
        const memberShip = await Membership.findOne({ gym: req.gym._id, months });

        if (memberShip) {
            memberShip.price = price;
            await memberShip.save();
            res.status(200).json({ message: 'Membership updated successfully' });
        } else {
            const newMembership = new Membership({
                months,
                price,
                gym: req.gym._id
            });
            await newMembership.save();
            res.status(200).json({ message: 'Membership added successfully' }); 
        }

    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({ error: 'Server error' });
    }
}

exports.getMembership = async (req, res) => {
    try {
        const loggedInId = req.gym._id;
        // Corrected the query to find the membership by gym
        const memberShip = await Membership.find({ gym: loggedInId });
        res.status(200).json({
            message: 'Membership fetched successfully',
            membership: memberShip
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
}